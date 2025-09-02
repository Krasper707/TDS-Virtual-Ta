document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selections ---
    const form = document.getElementById('qa-form');
    const questionInput = document.getElementById('question');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const fileNameElement = document.getElementById('file-name');
    const loadingSpinner = document.getElementById('loading');
    const responseContainer = document.getElementById('response-container');
    const answerElement = document.getElementById('answer');
    const linksElement = document.getElementById('links');
    const submitBtn = document.getElementById('submit-btn');

    // --- API Configuration ---
    const API_URL = "https://tds-virtual-ta-xs1q.vercel.app/api/";

    // --- Initial State ---
    // Hide the response container completely on page load.
    // It will be made visible only after a response is received.
    responseContainer.style.display = 'none';

    // --- Event Listener for Image Input ---
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            // Display the selected file's name
            fileNameElement.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else {
            // Reset to default state if no file is chosen
            fileNameElement.textContent = "Click or drag to upload";
            imagePreview.classList.add('hidden');
        }
    });

    // --- Event Listener for Form Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission

        const question = questionInput.value;
        const imageFile = imageInput.files[0];
        let base64Image = null;

        // --- Set UI to Loading State ---
        submitBtn.disabled = true;
        submitBtn.textContent = 'Thinking...';
        loadingSpinner.classList.remove('hidden');
        
        // Hide the previous response and remove the animation class for the next run
        responseContainer.classList.remove('visible');
        responseContainer.style.display = 'none';

        // Convert the image to base64 if one was provided
        if (imageFile) {
            base64Image = await toBase64(imageFile);
        }

        try {
            // --- Make the API Call ---
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    image: base64Image, // This will be null if no image was selected
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displayResponse(data);

        } catch (error) {
            console.error("API call failed:", error); // Log the error for debugging
            displayError(error.message);
        } finally {
            // --- Restore UI from Loading State ---
            loadingSpinner.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Get Answer';
        }
    });

    // --- Function to Display a Successful Response ---
    function displayResponse(data) {
        answerElement.textContent = data.answer;
        linksElement.innerHTML = ''; // Clear any previous links

        if (data.links && data.links.length > 0) {
            data.links.forEach(link => {
                const linkItem = document.createElement('a');
                linkItem.href = link.url;
                linkItem.target = "_blank"; // Open links in a new tab
                
                const urlElement = document.createElement('strong');
                try {
                    // Show just the hostname (e.g., "example.com") for a cleaner look
                    urlElement.textContent = new URL(link.url).hostname;
                } catch {
                    urlElement.textContent = link.url; // Fallback for invalid URLs
                }

                const textElement = document.createElement('p');
                textElement.className = 'link-text';
                textElement.textContent = link.text;
                
                linkItem.appendChild(urlElement);
                linkItem.appendChild(textElement);

                linksElement.appendChild(linkItem);
            });
        }
        
        // --- Trigger the Fade-In Animation ---
        // 1. Make the container a block element so it takes up space.
        responseContainer.style.display = 'block';
        
        // 2. Add the 'visible' class to trigger the CSS transition.
        // A tiny timeout ensures the browser processes the display change before starting the animation.
        setTimeout(() => {
            responseContainer.classList.add('visible');
        }, 10);
    }

    // --- Function to Display an Error Message ---
    function displayError(errorMessage) {
        answerElement.textContent = `An error occurred: ${errorMessage}`;
        linksElement.innerHTML = ''; // Clear links on error
        
        // Ensure the error message is also visible with the animation
        responseContainer.style.display = 'block';
        setTimeout(() => {
            responseContainer.classList.add('visible');
        }, 10);
    }

    // --- Utility Function to Convert a File to a Base64 String ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // The result includes a prefix like "data:image/jpeg;base64,"
            // We split on the comma and take the second part to get only the base64 data.
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
});