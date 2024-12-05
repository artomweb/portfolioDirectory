const apiUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:2078/"
    : "https://api.artomweb.com/portfolios/";

let currentPage = 1;
let totalPages = 1;
let isLoading = false; // Prevent multiple simultaneous loads
let seed = Math.random() * 100;
let displayedPortfolios = new Set();

function loadPortfolios() {
  // Prevent loading if already loading or if we've reached the last page
  if (isLoading || currentPage > totalPages) {
    return;
  }

  isLoading = true;

  let params = {};

  const urlParams = new URLSearchParams(window.location.hash.slice(1));
  const search = urlParams.get("search");
  const tag = urlParams.get("tag");

  if (search) {
    params = { search };
  } else if (tag) {
    params = { tag };
  }

  // Construct query string for fetch
  const queryParams = new URLSearchParams({
    page: currentPage,
    limit: 8,
    seed,
    random: true,
    ...params,
  }).toString();

  fetch(`${apiUrl}?${queryParams}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error fetching portfolios: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.total == 0) {
        const noResultsMessage = document.getElementById("noResultsMessage");

        noResultsMessage.classList.remove("hidden"); // Show the message
        portfolioList.innerHTML = ""; // Ensure the portfolio list is cleared
        return;
      } else {
        noResultsMessage.classList.add("hidden"); // Hide the message
      }
      const newPortfolios = data.data.filter(
        (portfolio) => !displayedPortfolios.has(portfolio._id)
      );

      const existingPortfolios = data.data.filter((portfolio) =>
        displayedPortfolios.has(portfolio._id)
      );

      existingPortfolios.forEach((portfolio) => {
        console.error("existing port", portfolio.artist);
        displayedPortfolios.add(portfolio._id);
      });

      newPortfolios.forEach((portfolio) => {
        console.log("new port", portfolio.artist);
        displayedPortfolios.add(portfolio._id);
      });

      displayPortfolios(newPortfolios);

      totalPages = data.totalPages;
      currentPage++;
    })
    .catch((error) => console.error(error))
    .finally(() => {
      isLoading = false;
    });
}

// Add event listener to detect when the user scrolls to the bottom of the page
window.addEventListener("scroll", () => {
  // Check if the user has scrolled near the bottom of the page
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadPortfolios(); // Trigger loading more portfolios
  }
});

document.getElementById("searchButton").addEventListener("click", () => {
  normalSearch(document.getElementById("searchInput").value);
});
document.getElementById("pageTitle").addEventListener("click", () => {
  seed = Math.random() * 100;
  history.replaceState(null, null, " ");
  document.getElementById("currentTag").classList.add("hidden");
  document.getElementById("searchInput").value = "";

  changePlaceholder();
  handleRouteChange();
});
document.getElementById("infoButton").addEventListener("click", () => {
  window.location.hash = "#info"; // Update the hash in the browser
  showInfoPage();
});

function showInfoPage() {
  document.getElementById("results").classList.add("hidden");
  document.getElementById("infoSection").classList.remove("hidden");
  document.getElementById("currentTag").classList.remove("opacity-100");
  document.getElementById("currentTag").classList.add("opacity-0");
  document.getElementById("currentTag").classList.add("hidden");
  document.getElementById("infoButton").classList.remove("text-gray-500");
  document.getElementById("searchInput").value = "";

  // window.history.pushState({ page: "info" }, "", url);
}

function hideInfoPage() {
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("infoSection").classList.add("hidden");
  document.getElementById("infoButton").classList.add("text-gray-500");
  document.getElementById("currentTag").classList.remove("opacity-100");
  document.getElementById("currentTag").classList.add("opacity-0");
  document.getElementById("currentTag").classList.add("hidden");
  // const url = new URL(window.location);
  // url.searchParams.delete("info");
  // window.history.replaceState({ page: "results" }, "", url);
}

// Search input event
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    normalSearch(e.target.value);
  }
});

function tagSearch(tag) {
  // Clear the current portfolio list
  document.getElementById("portfolioList").innerHTML = "";

  // Reset currentPage to 1 to start from the first page
  currentPage = 1;
  totalPages = 1;
  // Update the URL with the selected tag
  window.location.hash = "#tag=" + tag;

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  portfolioQueue = [];
  nextToShowIndex = 0; // Tracks the index of the next card to show
  imageIndex = 0;

  displayCurrentTag();
  displayedPortfolios.clear();
  // Load portfolios based on the selected tag
  loadPortfolios();
}

function normalSearch(searchTerm) {
  hideInfoPage();
  const portfolioList = document.getElementById("portfolioList");
  document.getElementById("searchInput").value = searchTerm;

  // Only clear if the "No portfolios found." message is not already present
  if (!portfolioList.querySelector("h1")) {
    portfolioList.innerHTML = ""; // Clear only the current list
  }

  portfolioQueue = [];
  nextToShowIndex = 0; // Tracks the index of the next card to show
  imageIndex = 0;

  currentPage = 1; // Reset to first page
  totalPages = 1;
  window.location.hash = "#search=" + searchTerm;
  // window.history.pushState({}, "", url);
  displayedPortfolios.clear();
  // Load portfolios based on the search term

  loadPortfolios();
}

function initializeMasonry() {
  const elem = document.querySelector("#portfolioList");
  return new Masonry(elem, {
    itemSelector: ".card",
    gutter: 16, // Optional gap between items
    fitWidth: true,
    transitionDuration: 0,
  });
}

// Initialize Masonry after the DOM loads
let msnry;
let portfolioQueue = [];
let nextToShowIndex = 0; // Tracks the index of the next card to show
let imageIndex = 0;
const IMAGE_LOAD_TIMEOUT = 1000; // 3 seconds fallback

function createPortfolioItem(portfolio, index) {
  const portfolioItem = document.createElement("div");
  const shuffledTags = shuffleArray([...portfolio.tags]); // Shuffle the tags
  const urlParams = new URLSearchParams(window.location.hash.slice(1));
  const tag = urlParams.get("tag");

  if (tag && !shuffledTags.slice(0, 3).includes(tag)) {
    shuffledTags.unshift(tag); // Add the tag to the front if it's not already in the array
  }

  const topTags = shuffledTags.slice(0, 3); // Get the first 3 tags

  portfolioItem.classList.add(
    "card",
    "bg-base-100",
    "shadow-xl",
    "sm:w-full",
    "md:w-96",
    "rounded-xl",
    "mb-6",
    "transition-opacity",
    "duration-200",
    "opacity-0" // Initially hidden
  );

  const img = document.createElement("img");
  img.src = `imgs/${portfolio.imageUrl}`;
  img.alt = `${portfolio.artist}'s portfolio image`;
  img.classList.add(
    "h-auto",
    "max-w-full",

    "opacity-0",
    "duration-300",
    "bg-gray-400"
  );

  // img.style.width = "500px"; // Fixed width
  img.style.height = "216px"; // Fixed height
  img.style.objectFit = "cover";

  // Fallback timer to show the card if the image doesn't load
  const timer = setTimeout(() => {
    // portfolioQueue[index].isLoaded = true; // Mark it as "loaded" due to timeout
    // nextToShowIndex++;
    // showNextPortfolioItem(); // Attempt to show the next in order
  }, IMAGE_LOAD_TIMEOUT);

  img.onerror = () => {
    // If the image fails to load, skip to the next item
    portfolioItem.classList.add("hidden");
    clearTimeout(timer);
    nextToShowIndex++; // Move to the next item in the queue
    showNextPortfolioItem(); // Attempt to show the next portfolio item
  };

  img.onload = () => {
    if (nextToShowIndex > index) {
      const figure = portfolioItem.querySelector("figure");
      figure.classList.remove("animate-pulse");

      img.classList.remove("opacity-0");
      img.classList.add("opacity-100");
      void portfolioItem.offsetHeight; // Trigger reflow to enable transition
      // portfolioItem.classList.remove("opacity-0");
      portfolioItem.classList.add("opacity-0");
      portfolioItem.classList.remove("opacity-0");
      portfolioItem.classList.add("opacity-100");
    }

    clearTimeout(timer); // Clear the fallback timer if the image loads
    portfolioQueue[index].isLoaded = true; // Mark this image as loaded
    showNextPortfolioItem(); // Attempt to show the next portfolio item in order

    if (msnry) {
      msnry.reloadItems();
      msnry.layout();
    }
  };

  const colors = [
    "badge-primary",
    "badge-secondary",
    "badge-accent",
    "badge-neutral",
  ];

  portfolioItem.innerHTML = `
    <figure class="bg-gray-100 rounded-lg animate-pulse">
      <a href="${
        portfolio.websiteUrl
      }" target="_blank" rel="noopener noreferrer"></a>
    </figure>
    <div class="card-body">
      <a href="${
        portfolio.websiteUrl
      }" target="_blank" rel="noopener noreferrer">
        <h2 class="card-title">${portfolio.artist}</h2>
      </a>
      <p>${portfolio.description}</p>
      <div class="flex justify-center card-actions">
        <a href="${
          portfolio.websiteUrl
        }" class="link truncate block w-full text-center mb-3">
          ${getDomain(portfolio.websiteUrl)}
        </a>
        <div class="flex gap-3 flex-wrap justify-center">
        ${topTags
          .map((tag, index) => {
            const hash =
              Array.from(tag).reduce(
                (acc, char) => acc + char.charCodeAt(0),
                0
              ) % colors.length;
            const color = colors[hash];
            return `<div class="badge ${color} badge-outline whitespace-nowrap cursor-pointer" onclick="tagSearch('${tag}')">${tag}</div>`;
          })
          .join("")}
        </div>
      </div>
    </div>
  `;

  portfolioItem.querySelector("figure a").appendChild(img);

  // Add this portfolio item to the queue
  portfolioQueue[index] = {
    element: portfolioItem,
    isLoaded: false, // Initially not loaded
  };

  return portfolioItem;
}

function showNextPortfolioItem() {
  while (
    nextToShowIndex < portfolioQueue.length &&
    portfolioQueue[nextToShowIndex].isLoaded
  ) {
    const portfolioItem = portfolioQueue[nextToShowIndex].element;
    const figure = portfolioItem.querySelector("figure");
    figure.classList.remove("animate-pulse");

    const img = portfolioItem.querySelector("img"); // Get the image element

    // Ensure the image is visible by removing the 'hidden' class and adding smooth opacity transition
    img.classList.remove("opacity-0");
    img.classList.add("opacity-100");

    void portfolioItem.offsetHeight; // Trigger reflow to enable transition
    portfolioItem.classList.add("opacity-0");
    portfolioItem.classList.remove("opacity-0");
    portfolioItem.classList.add("opacity-100");

    if (msnry) {
      msnry.reloadItems();
      msnry.layout();
    }

    nextToShowIndex++; // Move to the next item in the queue
  }
}

// Function to display portfolios
function displayPortfolios(portfolios) {
  const portfolioList = document.getElementById("portfolioList");

  portfolios.forEach((portfolio) => {
    const portfolioItem = createPortfolioItem(portfolio, imageIndex);
    imageIndex++;
    portfolioList.appendChild(portfolioItem); // Directly append the item to the list
    void portfolioItem.offsetHeight;
    portfolioItem.classList.add("opacity-100");

    if (msnry) {
      msnry.reloadItems(); // Reinitialize the Masonry layout if using a grid
      msnry.layout();
    }
  });
}

window.addEventListener("resize", function () {
  if (msnry) {
    msnry.reloadItems();
    msnry.layout();
  }
});

// Function to extract the domain from a URL
function getDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace("www.", ""); // Return the domain without "www."
  } catch (e) {
    return url; // If the URL is invalid, return it as-is
  }
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function doLoad() {
  const isProduction = window.location.hostname !== "localhost";
  const turnstileSiteKey = isProduction
    ? "0x4AAAAAAA0v_YXGwzb9e-qg"
    : "1x00000000000000000000AA";

  document
    .querySelector(".cf-turnstile")
    .setAttribute("data-sitekey", turnstileSiteKey);
  msnry = initializeMasonry();

  changePlaceholder();
  handleRouteChange();
}

const placeholderWords = [
  "photography",
  "design",
  "illustration",
  "sculpture",
  "painting",
  "digital",
];

function changePlaceholder() {
  let randomWords = shuffleArray(placeholderWords);

  randomWords = randomWords.slice(0, 2);

  const placeholderText = randomWords.join(", ");

  const inputElement = document.getElementById("searchInput");

  inputElement.placeholder = placeholderText;

  inputElement.classList.remove("placeholder-opacity-0");
  void inputElement.offsetWidth; // forces reflow
  inputElement.classList.add("placeholder-opacity-100");
}

// Call the function to load random portfolios when the page loads
document.addEventListener("DOMContentLoaded", doLoad());

function handleRouteChange() {
  portfolioQueue = [];
  nextToShowIndex = 0; // Tracks the index of the next card to show
  imageIndex = 0;
  displayedPortfolios.clear();
  const urlParams = new URLSearchParams(window.location.hash.slice(1));
  const searchTerm = urlParams.get("search");
  const tag = urlParams.get("tag");
  const info = urlParams.get("info");

  displayCurrentTag();

  if (info != null) {
    // If 'info' is true in the URL, show the info page
    showInfoPage();
  } else if (tag) {
    console.log("has tag", tag);
    hideInfoPage();
    tagSearch(tag); // Load portfolios filtered by tag
  } else if (searchTerm) {
    hideInfoPage();

    console.log("normal search");
    normalSearch(searchTerm); // Load portfolios filtered by search term
  } else {
    hideInfoPage();
    currentPage = 1;
    totalPages = 1;
    portfolioList.innerHTML = "";
    loadPortfolios(); // Load all portfolios if no filters are applied
  }
}

window.addEventListener("popstate", (event) => {
  handleRouteChange();
});

function displayCurrentTag() {
  const urlParams = new URLSearchParams(window.location.hash.slice(1));
  const tag = urlParams.get("tag");

  const currentTagElement = document.getElementById("currentTag");
  if (tag) {
    document.getElementById("currentTag").classList.remove("hidden");
    currentTagElement.textContent = tag;
    currentTagElement.classList.add("opacity-100");
  } else {
    currentTagElement.classList.add("opacity-0");
  }
}

document
  .getElementById("portfolioForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting

    const trn = turnstile.getResponse();

    // Check if the Turnstile response exists
    if (!trn) {
      alert("Please complete the CAPTCHA.");
      return;
    }

    // Get the form data
    const artist = document.getElementById("artist").value;
    const websiteUrl = document.getElementById("website").value;

    // Prepare the data to send
    const data = {
      artist,
      websiteUrl,
      "cf-turnstile-response": trn,
    };

    // Send the form data to the backend using fetch as JSON
    try {
      const response = await fetch(apiUrl + "/suggestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Ensures the body is sent as JSON
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert("Suggestion sent!");
      } else {
        console.log(result);
        alert("There was an error with the CAPTCHA verification.");
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      alert("There was an issue submitting the form.");
    } finally {
      turnstile.reset();
    }
  });
