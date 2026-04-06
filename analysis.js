

document.getElementById('home').addEventListener('click', async () => {
    window.location.href = 'index.html';
})

document.addEventListener("DOMContentLoaded", () => {
    let percentage = localStorage.getItem('percentage');
    let time = localStorage.getItem('slouchTime');
    let total = localStorage.getItem('totalTime');
    document.getElementById("percentage").textContent = percentage + '%';
    /*document.getElementById("slouch").textContent = time;
    document.getElementById('time').textContent = total;*/
});
