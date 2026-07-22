const loadProfileInput = document.getElementById('loadProfileInput');
const loadProfileImageBtn = document.getElementById('loadProfileImageBtn');
const profileImage = document.getElementById('profileImage');
const removeProfileImage = document.getElementById('removeProfileImage');


loadProfileImageBtn.addEventListener('click', () => {
    loadProfileInput.click();
});
loadProfileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeMB = Number(file.size / 1048576).toFixed(1);
    if (fileSizeMB > 3) {
        showWarningMessage("the file size is bigger than 3MB")
        return;
    }

    loadProfileImageBtn.style.display = 'none';
    profileImage.style.background = `url(${URL.createObjectURL(file)})`;
    removeProfileImage.style.display = "flex";
})

removeProfileImage.addEventListener('click', () => {
    profileImage.style.background = "url(/resources/ProfileCircle.svg)";
    loadProfileImageBtn.style.display = "flex";
    removeProfileImage.style.display = "none";
})