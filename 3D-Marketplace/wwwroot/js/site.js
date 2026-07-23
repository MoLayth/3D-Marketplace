const SignOptionPanel = document.getElementById('SignOptionPanel');
function ShowSignOptionPanel() {
    if (SignOptionPanel.style.display == "none") SignOptionPanel.style.display = "flex";
    else SignOptionPanel.style.display = "none";
}
function showEditProfilePanel() {

}

document.querySelectorAll(".closePanel ").forEach(elemnt => {
    elemnt.addEventListener('click', () => {
        document.getElementById(elemnt.getAttribute("targetPanelId")).style.display = "none";
    });
});

const SignPanel = document.getElementById('SignPanel');
function showSignPanel() {
    SignPanel.style.display = "flex";
}

document.getElementById('createAccountBtn').addEventListener('click', async () => {
    const userName = document.getElementById('userNameInput').value;
    const response = await fetch(`/Home/IsUserNameExist?userName=${userName}`);
    const responseValue = await response.json();

    if (responseValue === true) {
        showWarningMessage('Username already used');
        return;
    }

    const password = document.getElementById('passwordInput').value;
    const createAccountResponse = await fetch(`/Home/CreateAccount?user=${userName}&password=${password}`, {
        method:'POST',
    });

    if (!createAccountResponse.ok) {
        showWarningMessage('Something Wrong With The Server Please Try Again');
        return;
    }
    location.reload();
    //updateSignData(userName);
});

document.getElementById('SignInBtn').addEventListener('click', async () => {
    const userName = document.getElementById('userNameInput').value;
    const response = await fetch(`/Home/IsUserNameExist?userName=${userName}`);
    const responseValue = await response.json();

    if (responseValue === false) {
        showWarningMessage('Invalid username or password.');
        return;
    }

    const password = document.getElementById('passwordInput').value;
    const createAccountResponse = await fetch(`/Home/SignIn?user=${userName}&password=${password}`, {
        method: 'POST',
    });

    if (!createAccountResponse.ok) {
        showWarningMessage('Invalid username or password.');
        return;
    }
    location.reload();
    //updateSignData(userName);
});

//async function updateSignData(username) {

//    const response = await fetch(`/Home/GetUserData?Username${username}`, {
//        method: 'GET'
//    });

//    const value = await response.json();

//    sessionStorage.setItem("Name", value.name);
//    sessionStorage.setItem("bio", value.bio);
//    sessionStorage.setItem("profileImageUrl", value.profileImageUrl);
//}