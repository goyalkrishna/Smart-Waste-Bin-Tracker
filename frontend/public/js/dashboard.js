async function fetchBins() {
    const response = await fetch('/api/bins');
    const bins = await response.json();
    const tableBody = document.querySelector('#bins-table tbody');
    tableBody.innerHTML = '';

    bins.forEach(bin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bin.location}</td>
            <td>${bin.fillLevel} ${bin.fillLevel >= 80 ? '<span style="color:red;">(Full)</span>' : ''}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Fetch bins every 5 seconds
setInterval(fetchBins, 5000);
fetchBins();
