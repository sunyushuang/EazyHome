// 家庭装修管理应用 - 主脚本
class HomeDecorationApp {
    constructor() {
        this.mainContent = document.getElementById('main-content');
        this.navLinks = document.querySelectorAll('.sidebar nav ul li a');
        this.currentPage = null;
        this.budgetData = this.loadBudgetData();
        
        this.init();
    }

    init() {
        this.attachNavigationListeners();
        this.loadPage('Budget'); // 默认加载预算页面
    }

    // 导航事件监听器
    attachNavigationListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const pageName = link.dataset.page;
                this.loadPage(pageName);
                this.updateActiveNavigation(link);
            });
        });
    }

    // 更新导航状态
    updateActiveNavigation(activeLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    // 加载页面内容
    async loadPage(pageName) {
        try {
            this.showLoadingState();
            this.currentPage = pageName;
            
            if (pageName === 'Budget') {
                await this.loadBudgetPage();
            } else {
                this.loadPlaceholderPage(pageName);
            }
        } catch (error) {
            this.showErrorState(pageName, error);
        }
    }

    // 显示加载状态
    showLoadingState() {
        this.mainContent.innerHTML = '<div class="loading">加载中...</div>';
    }

    // 显示错误状态
    showErrorState(pageName, error) {
        console.error(`加载 ${pageName} 页面时出错:`, error);
        this.mainContent.innerHTML = `
            <div class="error">
                <h3>加载失败</h3>
                <p>无法加载 ${pageName} 页面: ${error.message}</p>
                <button onclick="location.reload()">重新加载</button>
            </div>
        `;
    }

    // 加载预算页面
    async loadBudgetPage() {
        try {
            const response = await fetch('budget.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const content = await response.text();
            this.mainContent.innerHTML = content;
            
            // 初始化预算管理器
            this.budgetManager = new BudgetManager(this.budgetData);
            this.budgetManager.init();
        } catch (error) {
            throw new Error(`获取预算页面失败: ${error.message}`);
        }
    }

    // 加载占位符页面
    loadPlaceholderPage(pageName) {
        const pageContent = {
            'Design': '设计管理 - 即将推出',
            'Project': '项目管理 - 即将推出', 
            'Materials': '材料管理 - 即将推出',
            'Furniture': '家具管理 - 即将推出'
        };

        this.mainContent.innerHTML = `
            <div class="page-placeholder">
                <h2>${pageName}</h2>
                <p>${pageContent[pageName] || '页面内容正在开发中...'}</p>
            </div>
        `;
    }

    // 加载预算数据
    loadBudgetData() {
        const saved = localStorage.getItem('budgetData');
        return saved ? JSON.parse(saved) : [];
    }

    // 保存预算数据
    saveBudgetData(data) {
        localStorage.setItem('budgetData', JSON.stringify(data));
    }
}

// 预算管理器类
class BudgetManager {
    constructor(initialData = []) {
        this.data = initialData;
        this.tableBody = null;
        this.totalBudgeted = 0;
        this.totalActual = 0;
    }

    init() {
        this.attachEventListeners();
        this.renderExistingData();
        this.updateTotals();
    }

    // 附加事件监听器
    attachEventListeners() {
        const addCategoryBtn = document.getElementById('add-category-btn');
        const addItemBtn = document.getElementById('add-item-btn');
        this.tableBody = document.querySelector('#budget-table tbody');

        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.addBudgetRow('Category'));
        }

        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addBudgetRow('Item'));
        }

        if (this.tableBody) {
            // 使用事件委托处理动态添加的元素
            this.tableBody.addEventListener('input', (event) => {
                if (event.target.matches('.budgeted-amount, .actual-cost')) {
                    this.handleAmountChange(event.target);
                }
            });

            this.tableBody.addEventListener('click', (event) => {
                if (event.target.matches('.delete-btn')) {
                    this.deleteRow(event.target.closest('tr'));
                }
            });
        }
    }

    // 处理金额变化
    handleAmountChange(input) {
        const value = parseFloat(input.value) || 0;
        
        // 验证输入
        if (value < 0) {
            input.value = 0;
            this.showNotification('金额不能为负数', 'warning');
            return;
        }

        const row = input.closest('tr');
        this.calculateRowDifference(row);
        this.updateTotals();
        this.saveData();
    }

    // 添加预算行
    addBudgetRow(type) {
        if (!this.tableBody) return;

        const newRow = this.createBudgetRow(type);
        this.tableBody.appendChild(newRow);
        
        // 聚焦到第一个输入框
        const firstInput = newRow.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
        }

        this.updateTotals();
    }

    // 创建预算行
    createBudgetRow(type, data = {}) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" 
                       class="category-input" 
                       placeholder="输入分类名称"
                       value="${data.category || ''}"
                       ${type === 'Category' ? 'required' : ''}>
            </td>
            <td>
                <input type="text" 
                       class="item-input" 
                       placeholder="输入项目名称"
                       value="${data.item || ''}"
                       ${type === 'Item' ? 'required' : ''}>
            </td>
            <td>
                <input type="number" 
                       class="budgeted-amount" 
                       placeholder="0"
                       min="0"
                       step="0.01"
                       value="${data.budgeted || ''}">
            </td>
            <td>
                <input type="number" 
                       class="actual-cost" 
                       placeholder="0"
                       min="0"
                       step="0.01"
                       value="${data.actual || ''}">
            </td>
            <td class="difference">${this.formatCurrency(0)}</td>
            <td>
                <button class="delete-btn" title="删除此行">
                    <span class="delete-icon">×</span>
                </button>
            </td>
        `;

        // 计算初始差值
        setTimeout(() => this.calculateRowDifference(row), 0);
        
        return row;
    }

    // 计算行差值
    calculateRowDifference(row) {
        const budgetedInput = row.querySelector('.budgeted-amount');
        const actualInput = row.querySelector('.actual-cost');
        const differenceCell = row.querySelector('.difference');

        if (budgetedInput && actualInput && differenceCell) {
            const budgeted = parseFloat(budgetedInput.value) || 0;
            const actual = parseFloat(actualInput.value) || 0;
            const difference = budgeted - actual;
            
            differenceCell.textContent = this.formatCurrency(difference);
            differenceCell.className = `difference ${difference >= 0 ? 'positive' : 'negative'}`;
        }
    }

    // 删除行
    deleteRow(row) {
        if (confirm('确定要删除这一行吗？')) {
            row.remove();
            this.updateTotals();
            this.saveData();
            this.showNotification('行已删除', 'success');
        }
    }

    // 更新总计
    updateTotals() {
        const rows = this.tableBody.querySelectorAll('tr');
        let totalBudgeted = 0;
        let totalActual = 0;

        rows.forEach(row => {
            const budgeted = parseFloat(row.querySelector('.budgeted-amount')?.value) || 0;
            const actual = parseFloat(row.querySelector('.actual-cost')?.value) || 0;
            totalBudgeted += budgeted;
            totalActual += actual;
        });

        this.totalBudgeted = totalBudgeted;
        this.totalActual = totalActual;

        this.updateTotalDisplay();
    }

    // 更新总计显示
    updateTotalDisplay() {
        let totalRow = document.querySelector('.total-row');
        if (!totalRow) {
            totalRow = document.createElement('tr');
            totalRow.className = 'total-row';
            this.tableBody.parentNode.appendChild(totalRow);
        }

        const totalDifference = this.totalBudgeted - this.totalActual;
        totalRow.innerHTML = `
            <td><strong>总计</strong></td>
            <td></td>
            <td><strong>${this.formatCurrency(this.totalBudgeted)}</strong></td>
            <td><strong>${this.formatCurrency(this.totalActual)}</strong></td>
            <td class="difference ${totalDifference >= 0 ? 'positive' : 'negative'}">
                <strong>${this.formatCurrency(totalDifference)}</strong>
            </td>
            <td></td>
        `;
    }

    // 渲染现有数据
    renderExistingData() {
        // 清除现有行（除了示例行）
        const existingRows = this.tableBody.querySelectorAll('tr');
        existingRows.forEach(row => {
            if (!row.querySelector('.budgeted-amount')?.value) {
                // 保留有数据的行，移除空行
            }
        });

        // 渲染保存的数据
        this.data.forEach(item => {
            const row = this.createBudgetRow('Item', item);
            this.tableBody.appendChild(row);
        });
    }

    // 保存数据
    saveData() {
        const rows = this.tableBody.querySelectorAll('tr:not(.total-row)');
        this.data = Array.from(rows).map(row => ({
            category: row.querySelector('.category-input')?.value || '',
            item: row.querySelector('.item-input')?.value || '',
            budgeted: parseFloat(row.querySelector('.budgeted-amount')?.value) || 0,
            actual: parseFloat(row.querySelector('.actual-cost')?.value) || 0
        })).filter(item => item.category || item.item); // 只保存有内容的行

        localStorage.setItem('budgetData', JSON.stringify(this.data));
    }

    // 格式化货币
    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
    new HomeDecorationApp();
});
