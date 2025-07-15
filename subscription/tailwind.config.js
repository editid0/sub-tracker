module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}', // or wherever your files are
    ],
    safelist: [
        'map-light',
        'map-dark',
        'dark:map-dark',
    ],
    darkMode: 'class', // or 'media', depending on your setup
    theme: {
        extend: {
            // Optional: define actual styles for map-dark/map-light here
        }
    }
}
