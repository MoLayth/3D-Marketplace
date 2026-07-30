const storeItem = document.getElementById('storeItem');
async function setUp() {
    const response = await fetch('/Home/GetAllProducts');
    const products = await response.json();
    products.forEach((p) => {
        storeItem.appendChild(createStoreItem(p.name, p.thumbnail, p.id));
    });
}

setUp();

/**
 * @param {string} name
 * @param {string} imagePath
 * @param {number} productId
 */
function createStoreItem(name, imagePath, productId) {
    const div = document.createElement('div');
    div.dataset.productId = productId;
    div.classList.add('Store-item-cover');
    div.style.background = `url(${imagePath})`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';

    const label = document.createElement('label');
    label.textContent = name;
    label.classList.add('Store-item-cover-label');

    div.appendChild(label)

    div.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.productId;

        window.location.href = `/Home/OpenEditProductPage?productId=${id}`;
    })

    return div;
}