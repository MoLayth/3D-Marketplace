(() => {
    const loadProfileInput = document.getElementById('loadProfileInput');
    const loadProfileImageBtn = document.getElementById('loadProfileImageBtn');
    const removeProfileImage = document.getElementById('removeProfileImage');

    let uploadedPic = null;
    let isImageRemoved = false;
    const defaultPic = "/resources/avatar.svg";

    loadProfileImageBtn.addEventListener('click', () => {
        loadProfileInput.click();
    });
    loadProfileInput.addEventListener('change', (e) => {
        uploadedPic = e.target.files[0];
        if (!uploadedPic) return;

        const fileSizeMB = Number(uploadedPic.size / 1048576).toFixed(1);
        if (fileSizeMB > 3) {
            e.target.value = ''; // resets the input element 
            showWarningMessage("the file size is bigger than 3MB")
            return;
        }

        isImageRemoved = false;

        loadProfileImageBtn.style.borderRadius = "50%";
        loadProfileImageBtn.style.width = "100%";
        loadProfileImageBtn.style.height = "100%";
        loadProfileImageBtn.style.objectFit = "cover";
        loadProfileImageBtn.src = URL.createObjectURL(uploadedPic);

        removeProfileImage.style.display = "flex";
    })

    removeProfileImage.addEventListener('click', () => {
        uploadedPic = null;
        isImageRemoved = true;

        loadProfileImageBtn.style.borderRadius = "0%";
        loadProfileImageBtn.style.width = "65%";
        loadProfileImageBtn.style.height = "65%";
        loadProfileImageBtn.style.objectFit = "fill";
        loadProfileImageBtn.src = defaultPic;

        removeProfileImage.style.display = "none";
    })

    const nameInput = document.getElementById('nameInput');
    const bioInput = document.getElementById('bioInput');
    // save profile
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
        const formData = new FormData();

        // this userName is set in the _Layout.cshtml
        formData.append("username", userName);
        formData.append("name", nameInput.value);
        formData.append("bio", bioInput.value);
        formData.append("removePicture", isImageRemoved);

        if (uploadedPic) {
            formData.append("profilePic", uploadedPic);
        } else {
            formData.append("profilePic", null);
        }


        const respawn = await fetch(`/Home/UpdateProfile`, {
            method: 'POST',
            body: formData
        });

        if (!respawn.ok) {
            showWarningMessage("Fail To Save");
            return;
        }
        window.location.reload();
    })

    // delete account
    document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
        if (!confirm("are you sure about deleting your account?")) {
            return;
        }

        // this userName is set in the _Layout.cshtml
        const respawn = await fetch(`/Home/DeleteAccount?username=${encodeURIComponent(userName)}`, {
            method: 'POST'
        });
        if (!respawn.ok) {
            showWarningMessage("Fail To Delete");
        }

        window.location.reload();
    })

    // sign out
    document.getElementById('signOutBtn').addEventListener('click', () => {
        if (!confirm("are you sure you want to sign out?")) {
            return;
        }

        fetch('/Home/SicgnOut', { method: 'POst' });
        window.location.reload();
    })

    const sellerProductsContainer = document.getElementById("sellerProductsContainer");

    async function setUpTheProducts() {
        try {
            const url = `/Home/LoadTab_StoreItems?targetSellerProducts=${encodeURIComponent(userName)}`;
            const response = await fetch(url, { method: 'GET' });

            if (response.ok) {
                const htmlText = await response.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');

                sellerProductsContainer.innerHTML = '';

                // Append non-script DOM nodes into sellerProductsContainer
                Array.from(doc.body.childNodes).forEach(node => {
                    if (node.tagName !== 'SCRIPT') {
                        sellerProductsContainer.appendChild(node.cloneNode(true));
                    }
                });

                // Re-create and execute script elements sequentially
                const scripts = doc.querySelectorAll('script');
                for (const oldScript of scripts) {
                    const newScript = document.createElement('script');

                    // Copy all attributes (type="importmap", src, etc.)
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });

                    newScript.textContent = oldScript.textContent;

                    document.head.appendChild(newScript);
                }

            } else {
                showWarningMessage("Something Went Wrong!!!");
            }
        } catch (error) {
            console.error("Failed to load products:", error);
            showWarningMessage("Something Went Wrong!!!");
        }
    }

    /**
     * @type {'horizontal' | 'vertical'}
     */
    let currentLayout = 'horizontal';

    const editProfileContainer = document.getElementById('editProfileContainer');
    window.addEventListener('resize', () => {
        updateLayout();
    })

    function updateLayout() {
        const layoutChangeTrigger = 900;
        // if that the case change the layout
        if (window.innerWidth < layoutChangeTrigger && currentLayout == 'horizontal') {
            editProfileContainer.classList.remove('Row-Flex-Container');
            editProfileContainer.classList.add('column-Flex-Container');
            currentLayout = 'vertical';
        }
        else if (window.innerWidth >= layoutChangeTrigger && currentLayout == 'vertical') {
            editProfileContainer.classList.remove('column-Flex-Container');
            editProfileContainer.classList.add('Row-Flex-Container');
            currentLayout = 'horizontal';
        }
    }

    updateLayout();
    setUpTheProducts();
})();