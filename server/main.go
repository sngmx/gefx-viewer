package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
)

const uploadDir = "C:\\Users\\sangam mahawar\\Documents\\code\\gefx-viewer\\uploads"

func main() {
	r := mux.NewRouter()

	// Log all incoming requests
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Received request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	})

	// Serve static files from the "static" directory
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join("C:\\Users\\sangam mahawar\\Documents\\code\\gefx-viewer\\static")))))

	// Serve the index.html file at the root URL
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Serving index.html")
		http.ServeFile(w, r, filepath.Join("C:\\Users\\sangam mahawar\\Documents\\code\\gefx-viewer\\static", "index.html"))
	})

	// Handle file upload
	r.HandleFunc("/upload", uploadHandler).Methods("POST")

	// Serve the uploaded GEXF file
	r.HandleFunc("/uploads/{filename}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		filename := vars["filename"]
		log.Printf("Serving uploaded file: %s", filename)
		http.ServeFile(w, r, filepath.Join(uploadDir, filename))
	}).Methods("GET")

	// Start the server
	fmt.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the multipart form
	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Retrieve the file from the form
	file, handler, err := r.FormFile("gexfFile")
	if err != nil {
		http.Error(w, "Unable to retrieve file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create the uploads directory if it doesn't exist
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, os.ModePerm)
	}

	// Create a new file in the uploads directory
	dst, err := os.Create(filepath.Join(uploadDir, handler.Filename))
	if err != nil {
		http.Error(w, "Unable to create file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Unable to save file", http.StatusInternalServerError)
		return
	}

	// Respond with the file URL
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "/uploads/%s", handler.Filename)
}
