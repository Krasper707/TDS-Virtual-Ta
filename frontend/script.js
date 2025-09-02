document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('qa-form');
    const questionInput = document.getElementById('question');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const loadingSpinner = document.getElementById('loading');
    const responseContainer = document.getElementById('response-container');
    const answerElement = document.getElementById('answer');
    const linksElement = document.getElementById('links');

    // IMPORTANT: Replace this with your actual deployed Vercel API URL
    const API_URL = "YOUR_DEPLOYED_API_ENDPOINT/api/"; 
    // Example: "https://my-fastapi-app.vercel.app/api/"

    // Handle image preview
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else {
            imagePreview.classList.add('hidden');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const question = questionInput.value;
        const imageFile = imageInput.files[0];
        let base64Image = null;

        // Show loading spinner and hide previous response
        loadingSpinner.classList.remove('hidden');
        responseContainer.classList.add('hidden');

        // Convert image to base64 if it exists
        if (imageFile) {
            base64Image = await toBase64(imageFile);
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    image: base64Image,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displayResponse(data);

        } catch (error) {
            displayError(error.message);
        } finally {
            // Hide loading spinner
            loadingSpinner.classList.add('hidden');
        }
    });

    function displayResponse(data) {
        answerElement.textContent = data.answer;
        linksElement.innerHTML = ''; // Clear previous links

        if (data.links && data.links.length > 0) {
            data.links.forEach(link => {
                const linkItem = document.createElement('a');
                linkItem.href = link.url;
                linkItem.target = "_blank"; // Open in new tab
                
                const urlElement = document.createElement('strong');
                urlElement.textContent = link.url;

                const textElement = document.createElement('p');
                textElement.className = 'link-text';
                textElement.textContent = link.text;
                
                linkItem.appendChild(urlElement);
                linkItem.appendChild(textElement);

                linksElement.appendChild(linkItem);
            });
        }
        responseContainer.classList.remove('hidden');
    }

    function displayError(errorMessage) {
        answerElement.textContent = `An error occurred: ${errorMessage}`;
        linksElement.innerHTML = '';
        responseContainer.classList.remove('hidden');
    }

    // Utility to convert file to base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // The result includes the data URL prefix (e.g., "data:image/jpeg;base64,").
            // We need to strip this prefix as the backend expects only the base64 string.
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
});