function showAlert(title, message) {
    const alertOverlay = document.createElement('div');
    alertOverlay.className = 'custom-alert';
    
    alertOverlay.innerHTML = `
        <div class="alert-content">
            <h3 class="alert-title">${title}</h3>
            <p class="alert-message">${message}</p>
            <button class="alert-button">Aceptar</button>
        </div>
    `;
    
    document.body.appendChild(alertOverlay);
    
    const closeButton = alertOverlay.querySelector('.alert-button');
    closeButton.addEventListener('click', function() {
        document.body.removeChild(alertOverlay);
    });
    
    alertOverlay.addEventListener('click', function(e) {
        if (e.target === alertOverlay) {
            document.body.removeChild(alertOverlay);
        }
    });
}