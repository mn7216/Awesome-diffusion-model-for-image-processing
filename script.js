async function fetchData() {
    const response = await fetch('data.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} while fetching data.json`);
    }
    const data = await response.json();
    return data;
}

function populateTable(tableElement, data) {
    const tableBody = tableElement.querySelector('tbody');
    if (!tableBody) {
        console.error("Could not find tbody in table:", tableElement);
        const errorMsg = document.createElement('p');
        errorMsg.textContent = "Error: Table structure is missing 'tbody'.";
        errorMsg.style.color = "red";
        tableElement.parentNode.insertBefore(errorMsg, tableElement);
        return;
    }
    tableBody.innerHTML = ''; 

    data.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = item.model || '--';
        
        const paperCell = row.insertCell();
        if (item.paper && item.paper.url && item.paper.title) {
            const paperLink = document.createElement('a');
            paperLink.href = item.paper.url;
            paperLink.textContent = item.paper.title;
            paperCell.appendChild(paperLink);
        } else {
            paperCell.textContent = '--';
        }

        row.insertCell().textContent = item.first_author || '--';
        
        const venueCell = row.insertCell();
        if (item.venue && item.venue.text) {
            venueCell.textContent = item.venue.text;
            if (item.venue.year) {
                venueCell.dataset.year = item.venue.year;
            }
        } else {
            venueCell.textContent = '--';
        }
        
        const repoCell = row.insertCell();
        if (item.repository) {
            repoCell.innerHTML = createGithubBadge(item.repository);
        }
    });
}

function createGithubBadge(repoUrl) {
    if (!repoUrl) return '';
    const repoPath = repoUrl.replace(/https?:\/\/github.com\//, '');
    const badgeUrl = `https://img.shields.io/github/stars/${repoPath}?style=for-the-badge&logoColor=%2320232a&labelColor=%2320232a&color=%23555555`;
    return `<a href="${repoUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="GitHub Repo stars"></a>`;
}

function makeTableSortable(table) {
    const headers = table.querySelectorAll('th');
    let currentSort = {
        columnIndex: -1,
        isAscending: true
    };

    headers.forEach((header, columnIndex) => {
        header.addEventListener('click', () => {
            const tableBody = table.querySelector('tbody');
            if (!tableBody) return;
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            
            let isAscending = true;
            if (currentSort.columnIndex === columnIndex) {
                isAscending = !currentSort.isAscending;
            } else {
                isAscending = true; 
            }

            const direction = isAscending ? 1 : -1;

            const sortedRows = rows.sort((a, b) => {
                const aCell = a.querySelector(`td:nth-child(${columnIndex + 1})`);
                const bCell = b.querySelector(`td:nth-child(${columnIndex + 1})`);

                if (!aCell || !bCell) return 0;

                let aText = aCell.textContent.trim().toLowerCase();
                let bText = bCell.textContent.trim().toLowerCase();

                if (header.textContent.trim().toLowerCase() === 'venue') {
                    aText = aCell.dataset.year || aText; 
                    bText = bCell.dataset.year || bText;
                }
                
                const aNum = parseFloat(aText);
                const bNum = parseFloat(bText);

                if (!isNaN(aNum) && !isNaN(bNum) && (header.textContent.trim().toLowerCase() === 'venue' || header.textContent.trim().toLowerCase() === 'year')) {
                    if (aNum < bNum) return -1 * direction;
                    if (aNum > bNum) return 1 * direction;
                    return 0;
                }

                if (aText < bText) return -1 * direction;
                if (aText > bText) return 1 * direction;
                return 0;
            });

            headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            header.classList.toggle('sort-asc', isAscending);
            header.classList.toggle('sort-desc', !isAscending);
            currentSort.columnIndex = columnIndex;
            currentSort.isAscending = isAscending;
            
            rows.forEach(row => tableBody.removeChild(row)); 
            sortedRows.forEach(row => tableBody.appendChild(row));
        });
    });
}

function updateVenueDisplay(table) {
    const venueHeaderIndex = Array.from(table.querySelectorAll('thead th')).findIndex(th => th.textContent.trim().toLowerCase() === 'venue');
    if (venueHeaderIndex === -1) return;

    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const venueCell = row.querySelector(`td:nth-child(${venueHeaderIndex + 1})`);
        if (venueCell) {
            const dateValue = venueCell.dataset.year; 
            const originalText = venueCell.textContent.trim();
            if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                if (!originalText.startsWith(dateValue + " / ")) {
                    venueCell.textContent = `${dateValue} / ${originalText}`;
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('.sortable-table');
    if (tables.length === 0) {
        const body = document.querySelector('body');
        const noTableDiv = document.createElement('div');
        noTableDiv.textContent = 'No sortable tables found on this page.';
        noTableDiv.style.color = 'orange';
        body.appendChild(noTableDiv);
        return;
    }

    tables.forEach(async table => {
        const data = await fetchData();
        populateTable(table, data);
        makeTableSortable(table);
        updateVenueDisplay(table);
    });
});
