
document.addEventListener('DOMContentLoaded', () => {
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

    const API_URL = "https://tds-virtual-ta-xs1q.vercel.app/api/";  // <-- IMPORTANT: Make sure this is your correct URL!

    // Handle image preview and file name display
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            fileNameElement.textContent = file.name; // Show file name
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else {
            fileNameElement.textContent = "Click or drag to upload";
            imagePreview.classList.add('hidden');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const question = questionInput.value;
        const imageFile = imageInput.files[0];
        let base64Image = null;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Thinking...';
        loadingSpinner.classList.remove('hidden');
        responseContainer.classList.remove('visible'); // Hide previous response for animation

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
            // Hide loading state and restore button
            loadingSpinner.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Get Answer';
        }
    });

    function displayResponse(data) {
        answerElement.textContent = data.answer;
        linksElement.innerHTML = ''; // Clear previous links

        if (data.links && data.links.length > 0) {
            data.links.forEach(link => {
                const linkItem = document.createElement('a');
                linkItem.href = link.url;
                linkItem.target = "_blank";
                
                const urlElement = document.createElement('strong');
                urlElement.textContent = new URL(link.url).hostname; // Show hostname for cleaner look

                const textElement = document.createElement('p');
                textElement.className = 'link-text';
                textElement.textContent = link.text;
                
                linkItem.appendChild(urlElement);
                linkItem.appendChild(textElement);

                linksElement.appendChild(linkItem);
            });
        }
        // Trigger the animation by adding the 'visible' class
        responseContainer.classList.add('visible');
    }

    function displayError(errorMessage) {
        answerElement.textContent = `An error occurred: ${errorMessage}`;
        linksElement.innerHTML = '';
        responseContainer.classList.add('visible');
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
});