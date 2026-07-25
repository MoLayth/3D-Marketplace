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
        formData.append("username", currentUsername);
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
        if (!confirm("are you sure about that?")) {
            return;
        }

        const respawn = await fetch(`/Home/DeleteAccount?username=${encodeURIComponent(currentUsername)}`, {
            method: 'POST'
        });
        if (!respawn.ok) {
            showWarningMessage("Fail To Delete");
        }

        window.location.reload();
    })

    // sign out
    document.getElementById('signOutBtn').addEventListener('click', () => {
        if (!confirm("are you sure about that?")) {
            return;
        }

        fetch('/Home/SicgnOut', { method: 'POst' });
        window.location.reload();
    })
})();