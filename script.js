document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');

    // Function to load page content
    async function loadPage(pageName) {
        mainContent.innerHTML = ''; // Clear previous content
        if (pageName === 'Budget') {
            try {
                const response = await fetch('budget.html');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const content = await response.text();
                mainContent.innerHTML = content;
                attachBudgetEventListeners(); // Attach event listeners for budget page elements
            } catch (error) {
                mainContent.innerHTML = `<p>Error loading ${pageName} page: ${error.message}</p>`;
                console.error('Error fetching budget.html:', error);
            }
        } else {
            mainContent.innerHTML = `<p>${pageName} Content Area</p>`;
        }
    }

    // Add event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageName = link.dataset.page;
            loadPage(pageName);
        });
    });

    // Initial page load: Load Budget page by default
    loadPage('Budget'); 

    // --- Budget Page Specific Functions ---
    function attachBudgetEventListeners() {
        const addCategoryBtn = document.getElementById('add-category-btn');
        const addItemBtn = document.getElementById('add-item-btn');
        const budgetTableBody = document.querySelector('#budget-table tbody');

        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                addBudgetRow('Category');
            });
        }

        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                addBudgetRow('Item');
            });
        }
        
        if (budgetTableBody) {
            budgetTableBody.addEventListener('input', (event) => {
                if (event.target.classList.contains('budgeted-amount') || event.target.classList.contains('actual-cost')) {
                    calculateDifference(event.target.closest('tr'));
                }
            });
        }
        // Calculate initial differences for pre-populated rows
        document.querySelectorAll('#budget-table tbody tr').forEach(row => {
            calculateDifference(row);
        });
    }

    function addBudgetRow(type) {
        const budgetTableBody = document.querySelector('#budget-table tbody');
        if (!budgetTableBody) return;

        const newRow = budgetTableBody.insertRow();
        const categoryCell = newRow.insertCell();
        const itemCell = newRow.insertCell();
        const budgetedCell = newRow.insertCell();
        const actualCell = newRow.insertCell();
        const differenceCell = newRow.insertCell();
        differenceCell.classList.add('difference');

        if (type === 'Category') {
            categoryCell.innerHTML = `<input type="text" placeholder="New Category Name">`;
            itemCell.innerHTML = 'N/A'; // Or make it editable if items can be standalone
        } else { // Item
            categoryCell.innerHTML = `<input type="text" placeholder="Category Name">`; // Or a dropdown if categories are predefined
            itemCell.innerHTML = `<input type="text" placeholder="New Item Name">`;
        }
        
        budgetedCell.innerHTML = `<input type="number" class="budgeted-amount" placeholder="0">`;
        actualCell.innerHTML = `<input type="number" class="actual-cost" placeholder="0">`;
        differenceCell.textContent = '0';

        // Attach event listener to new input fields in this row
        [budgetedCell.firstChild, actualCell.firstChild].forEach(input => {
            input.addEventListener('input', () => calculateDifference(newRow));
        });
         calculateDifference(newRow); // Calculate initial difference (which will be 0)
    }

    function calculateDifference(row) {
        const budgetedAmountInput = row.querySelector('.budgeted-amount');
        const actualCostInput = row.querySelector('.actual-cost');
        const differenceCell = row.querySelector('.difference');

        if (budgetedAmountInput && actualCostInput && differenceCell) {
            const budgeted = parseFloat(budgetedAmountInput.value) || 0;
            const actual = parseFloat(actualCostInput.value) || 0;
            differenceCell.textContent = (budgeted - actual).toFixed(2);
        }
    }
});
