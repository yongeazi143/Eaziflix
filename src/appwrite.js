const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
import { Client, Databases, Query, ID, Account } from "appwrite";

const appWriteEndPoint = "https://fra.cloud.appwrite.io/v1";

const client = new Client();
client.setEndpoint(appWriteEndPoint).setProject(PROJECT_ID);

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
  // Initialize Appwrite client to check if the search term already exists
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("search_term", searchTerm),
    ]);
    

    if (result.documents.length > 0) {
      // If the search term exists, increment the count
      const document = result.documents[0];

      await database.updateDocument(DATABASE_ID, COLLECTION_ID, document.$id, {
        searchCount: document.searchCount + 1,
      });
    } else {
      // If the search term does not exist, create a new document
      await database.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(), // Generate a unique ID for the new document
        {
          search_term: searchTerm,

          searchCount: 1,
          movie_id: movie ? movie.id : null, // Store the movie ID if available
          poster_url: movie
            ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
            : null, // Store the poster URL if available
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};


export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc("searchCount"),
      Query.limit(5), // Limit to 5 trending movies
      
    ]);
   
    if (result.documents.length === 0) {
      throw new Error("No trending movies found");
    }

    return result.documents.map((doc) => ({
      search_term: doc.search_term,
      searchCount: doc.searchCount,
      movie_id: doc.movie_id,
      poster_url: doc.poster_url,
    }));
  } catch (error) {
    console.error(error);
    throw new Error(" Failed to fetch trending movies from Appwrite");
    
  }
}


// Account management
export const account = new Account(client);
export { ID } from 'appwrite';