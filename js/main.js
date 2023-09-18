
const TMDB_MOVIE_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';
const TMDB_API_KEY = '24d863d54c86392e6e1df55b9a328755';

const favouritesButton = document.querySelector('#favouritesButton');
const searchResultsContainer = document.querySelector('#searchResults');
const movieDetailsContainer = document.querySelector('#movieDetails');
const castDetailsContainer = document.querySelector('#castDetails');
const searchFormNode = document.querySelector('#searchForm');
const movieQueryInput = document.querySelector('#movieQuery');
const errorMessageNode = document.querySelector('#errorMessage');
let favouriteMovieIDs = [];

// Retrieve favourite movies from localStorage
const savedMovieIDs = JSON.parse(localStorage.getItem('favourites'));
if(Array.isArray(savedMovieIDs)) {
  favouriteMovieIDs = savedMovieIDs;
}

// Handle the form input text
searchFormNode.addEventListener('submit', function(ev){
  ev.preventDefault();
  const newMovieQuery = movieQueryInput.value;

  if(newMovieQuery.trim().length === 0) {
    errorMessageNode.innerHTML = 'Please enter a movie name.'
    return; //early return
  }
  
  loadSearchResults(newMovieQuery);
});

// When user start typing on the input field, the previous error message disappear
movieQueryInput.addEventListener('input', function(ev){
  if(ev.target.value.trim().length > 0){
    errorMessageNode.innerHTML = '';
  }
});

// When Favourites button is clicked
favouritesButton.addEventListener('click', function(ev) {
  ev.preventDefault();

  if(favouriteMovieIDs.length > 0) {
    // Clear previous search results
    searchResultsContainer.replaceChildren();
    // Make sure movieDetailsContainer and castDetailsContainer are hidden
    movieDetailsContainer.style.display = 'none';
    castDetailsContainer.style.display = 'none';
    favouriteMovieIDs.forEach(id => {
      axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
        params: {
          api_key: TMDB_API_KEY
        }
      })
      .then(res => {
        generateFavouriteMovie(res);
      })
      .catch(err => {
        console.log('Error loading movie details', err);
      });
      
    });
    searchResultsContainer.style.display = 'grid';
  } else {
    errorMessageNode.innerHTML = 'There is no favourite movie saved';
  }
});

// Function to generate and display favorite movie results
const generateFavouriteMovie = (res) => {

  const movie = res.data;
  const divTag = document.createElement('div');
  divTag.className = 'result';
  divTag.style.width = '210px';
  // Create the image element for the movie poster
  const imgTag = document.createElement('img');
  imgTag.className = 'movie-poster';
  imgTag.src = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
  imgTag.alt = movie.title;
  divTag.appendChild(imgTag);

  // Create the element to display movie title and year
  const titleTag = document.createElement('h3');
  titleTag.innerHTML = `${movie.title} (${movie.release_date.substring(0, 4)})`;
  divTag.appendChild(titleTag);

  searchResultsContainer.appendChild(divTag);

  divTag.addEventListener('click', function () {
    errorMessageNode.innerHTML = '';
    searchResultsContainer.style.display = 'none';
    showMovieDetails(movie.id);
  });
};

// Load the search results from the input text entered by user
const loadSearchResults = (movieName) => {
  // Make an AJAX request to get a list movies from the user input text
  axios.get(TMDB_MOVIE_SEARCH_URL, {
    params: {
      api_key: TMDB_API_KEY,
      query: movieName
    }
  })
  .then( res => {
    generateSearchResults(res);
  })
  .catch( err => {
    console.log( 'Error loading search results', err );
  });
};

// Show a list of movies related to the movie name entered
const generateSearchResults = (res) => {
  // Clear previous search results
  searchResultsContainer.replaceChildren();

  // Make sure movieDetailsContainer and castDetailsContainer are hidden
  movieDetailsContainer.style.display = 'none';
  castDetailsContainer.style.display = 'none';

  // Loop over each movie result
  res.data.results.forEach( movie => {
    const divTag = document.createElement('div');
    divTag.className = 'result';
    divTag.style.width = '210px';
    // Only display movies that has a vote count and has a poster path
    if(movie.vote_count > 0 && movie.poster_path !== null) {
      // Create the image element for the movie poster
      const imgTag = document.createElement('img');
      imgTag.className = "movie-poster";
      imgTag.src = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
      imgTag.alt = movie.title;
      divTag.appendChild(imgTag);

      // Create the element to display movie title and year only
      const titleTag = document.createElement('h3');
      titleTag.innerHTML = `${movie.title} (${movie.release_date.substring(0, 4)})`;
      divTag.appendChild(titleTag);
      
      searchResultsContainer.appendChild(divTag);
      searchResultsContainer.style.display = 'grid';
            
      // Add a click event listener to show movie details when clicked
      divTag.addEventListener('click', function() {
        errorMessageNode.innerHTML = '';
        searchResultsContainer.style.display = 'none';
        showMovieDetails(movie.id);
      });
    } 
  });
};

// Function to get movie details based on the movie id
const showMovieDetails = (movieId) => {
  // Make an AJAX request to get the details of a selected movie Id
  axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
    params: {
      api_key: TMDB_API_KEY
    }
  })
  .then(res => {
    generateMovieDetails(res);

    showProductionCompanies(res);

    showCastAndCrew(movieId);

    generateButtons(movieId);
  })
  .catch(err => {
    console.log('Error loading movie details', err);
  });
};

// Function to format number as dollar amount with commas
const formatNumber = (number) => {
  return number.toLocaleString();
};

// Function to show the movie details
const generateMovieDetails = (res) => {
  let backdropPicture = res.data.backdrop_path;
  let width = 400;
  // If there's no backdrop picture, use the poster image instead
  if(backdropPicture === null) {
    backdropPicture = res.data.poster_path;
    width = 200;
  }
  // movieDetails will include Official website if there's any
  const movieDetails = `
    <div>
      <h2>${res.data.title} (${res.data.release_date.substring(0, 4)})</h2>
      <img src="https://image.tmdb.org/t/p/w${width}${backdropPicture}" alt="${res.data.title}">
      <p>${res.data.overview}</p>
      <div class="number-info">Budget: $${formatNumber(res.data.budget)}</div>
      <div class="number-info">Revenue: $${formatNumber(res.data.revenue)}</div>
      <div class="number-info">Vote Average: ${res.data.vote_average}</div>
      <div class="number-info">Vote Count: ${res.data.vote_count}</div>
      ${res.data.homepage !== '' ? `<div class="number-info"><a href="${res.data.homepage}" target="_blank">Official Website</a></div>` : ''}
    </div>
  `;
  
  movieDetailsContainer.innerHTML = movieDetails;
  movieDetailsContainer.style.display = 'block';
};

// Function to show 'Add to Favourite' and 'Remove from Favourite' buttons
const generateButtons = (id) => {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.paddingBottom = '1.5rem';

  // Check if the movie is already in the favorites list
  const isFavourite = favouriteMovieIDs.includes(id);

  const favouriteButton = document.createElement('button');
  favouriteButton.style.fontSize = '1rem';
  favouriteButton.innerHTML = isFavourite ? 'Remove from Favourite' : 'Add to Favourite';
  favouriteButton.style.marginRight = '20px';
  buttonContainer.appendChild(favouriteButton);

  const backToSearchResultsButton = document.createElement('button');
  backToSearchResultsButton.style.fontSize = '1rem';
  backToSearchResultsButton.innerHTML = 'Back to Search Results';
  buttonContainer.appendChild(backToSearchResultsButton);

  // For some reason, if I didn't delay, the button doesn't appear on the bottom
  setTimeout(() => {
    movieDetailsContainer.appendChild(buttonContainer);
  }, 500);

  // Toggle the favorite status when the button is clicked
  favouriteButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (isFavourite) {
      // Remove the movie from the favorites list
      const index = favouriteMovieIDs.indexOf(id);
      if (index !== -1) {
        favouriteMovieIDs.splice(index, 1);
        saveMoviesToLocalStorage();
      }
    } else {
      // Add the movie to the favorites list
      favouriteMovieIDs.push(id);
      saveMoviesToLocalStorage();
    }
    // Toggle the button text
    favouriteButton.innerHTML = isFavourite ? 'Add to Favourite' : 'Remove from Favourite';
  });

  // Handle the back button to return to the search results
  backToSearchResultsButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    movieDetailsContainer.style.display = 'none';
    searchResultsContainer.style.display = 'grid';
  });
};

// Save favourite movies to local storage with 'favourites' as key name
const saveMoviesToLocalStorage = function(){
  localStorage.setItem('favourites', JSON.stringify(favouriteMovieIDs));
};


// Function to show production companies
const showProductionCompanies = (res) => {
  const productionCompanies = res.data.production_companies;
  if (productionCompanies.length > 0) {
    const productionCompaniesList = document.createElement('ul');
    productionCompaniesList.innerHTML = "<strong><u>Production Companies:</u></strong>";
    productionCompaniesList.style.textAlign = 'left';
    movieDetailsContainer.appendChild(productionCompaniesList);

    productionCompanies.slice(0, 3).forEach(company => {
      const companyItem = document.createElement('li');
      const companyLink = document.createElement('a');
      companyLink.href = `https://www.themoviedb.org/company/${company.id}`;
      companyLink.target = '_blank';
      companyLink.innerText = company.name;
      companyItem.appendChild(companyLink);
      productionCompaniesList.appendChild(companyItem);
    });
  }
};

// Funtion to get cast and crew names based on the movie id
const showCastAndCrew = (movieId) => {
  // Make an AJAX request to get the detailed cast & crew information
  axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
    params: {
      api_key : TMDB_API_KEY
    }
  })
  .then(res => {
    generateCastandCrew(res);

    handleCastLinks();
  })
  .catch(err => {
    console.log('Error loading cast & crew information', err);
  });
};

// Function to show casts and crews of the movie
const generateCastandCrew = (res) => {
  // Create a container div for cast and crew information
  const castAndCrewSection = document.createElement('div');
  castAndCrewSection.style.display = 'grid'; // Set the grid display
  castAndCrewSection.style.gridTemplateColumns = '50% 50%'; // Two columns grid
  castAndCrewSection.style.textAlign = 'center'; // Center-align the content
  movieDetailsContainer.appendChild(castAndCrewSection);

  // Create a div for "Cast:" and align it to the left
  const castDiv = document.createElement('div');
  castDiv.style.textAlign = 'center';
  castDiv.innerHTML = "<strong><u>Cast:</u></strong><br>";
  res.data.cast.slice(0, 4).forEach((cast) => {
    const castItem = document.createElement('div');
    const castLink = document.createElement('a');
    castLink.classList.add('cast-movie-link');
    castLink.href = '#'; // Set the link's href attribute to "#" (to avoid navigation)
    castLink.dataset.castId = cast.id; // Set the data-movie-id attribute to the cast ID
    castLink.innerHTML = cast.name;
    castItem.appendChild(castLink);
    castDiv.appendChild(castItem);
  });
  castAndCrewSection.appendChild(castDiv);

  // Create a div for "Crew:" and align it to the right
  const crewDiv = document.createElement('div');
  crewDiv.style.textAlign = 'center';
  crewDiv.innerHTML = "<strong><u>Crew:<u/></strong><br>";
  res.data.crew.slice(0, 4).forEach(crew => {
    const crewItem = document.createElement('div');
    crewItem.innerHTML = `${crew.job}: ${crew.name}`;
    crewDiv.appendChild(crewItem);
  });
  castAndCrewSection.appendChild(crewDiv);
};

// Add the click event listener to the cast name links
const handleCastLinks = () => {
  const castLinks = document.querySelectorAll('.cast-movie-link');
  castLinks.forEach((link) => {
    link.addEventListener('click', function (ev) {
      ev.preventDefault();
      movieDetailsContainer.style.display = 'none';
      showCastDetails(this.dataset.castId);
    });
  });
};

// Function to show the details page for a cast member
const showCastDetails = function(castId) {
  // Make an AJAX request to get the detailed information about the cast member
  axios.get(`https://api.themoviedb.org/3/person/${castId}`, {
    params: {
      api_key : TMDB_API_KEY
    }
  })
  .then(res => {
    // Format the retrieved data into HTML tags for the cast member details
    const castDetails = `
      <div>
        <h2>${res.data.name}</h2>
        <img src="https://image.tmdb.org/t/p/w300${res.data.profile_path}" alt="${res.data.name}">
        <p>Birthday: ${res.data.birthday}</p>
        <p>Place of Birth: ${res.data.place_of_birth}</p>
      </div>
    `;

    castDetailsContainer.innerHTML = castDetails;
    castDetailsContainer.style.display = 'block';
    generateBackToMovieButton();
  })
  .catch(err => {
    console.log('Error loading cast member details', err);
  });
};

// Create 'Back to movie details' button in cast details page
const generateBackToMovieButton = () => {
  const buttonContainer = document.createElement('div');
  const backToMovieButton = document.createElement('button');
  backToMovieButton.style.fontSize = '1rem';
  buttonContainer.appendChild(backToMovieButton);
  backToMovieButton.innerHTML = 'Back to Movie Details';
  buttonContainer.style.paddingBottom = '1.5rem';
  castDetailsContainer.appendChild(buttonContainer);;

  backToMovieButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    castDetailsContainer.style.display = 'none';
    movieDetailsContainer.style.display = 'block';
  });
};



