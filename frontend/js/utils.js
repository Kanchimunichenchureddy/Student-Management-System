
// DOM Elements
const messageContainer = document.getElementById('messageContainer');

export function showMessage(message, type = 'info') {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);

    // Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} fa-lg"></i>
        <div class="toast-content">${messageString}</div>
    `;

    if (messageContainer) {
        messageContainer.appendChild(toast);
        messageContainer.style.display = 'block';
    }

    // Slide In
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            if (messageContainer && messageContainer.children.length === 0) {
                messageContainer.style.display = 'none';
            }
        }, 300);
    }, 3000);
}

export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function clearErrors(formId) {
    const errorElements = document.querySelectorAll(`#${formId} .error`);
    const inputElements = document.querySelectorAll(`#${formId} input, #${formId} select`);
    errorElements.forEach(el => el.textContent = '');
    inputElements.forEach(el => el.classList.remove('error'));
}
