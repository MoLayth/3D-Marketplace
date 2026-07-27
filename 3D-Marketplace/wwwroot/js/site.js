const SignOptionPanel = document.getElementById('SignOptionPanel');
function ShowSignOptionPanel() {
    if (SignOptionPanel.style.display == "none") SignOptionPanel.style.display = "flex";
    else SignOptionPanel.style.display = "none";
}
function showEditProfilePanel() {
    switchToTab('EditProfile');
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

const tabContainer = document.getElementById('tabElementContainer');
async function switchToTab(tabName) {

    // check if the user is sign in
    const checkResponse = await fetch('/Home/IsUserSignIn', { method: 'GET' });
    const isUserSignIn = await checkResponse.json();
    if (!isUserSignIn) {
        showWarningMessage("Sign In/ Create Account First");
        return;
    }

    let html = "";
    let response = null;

    switch (tabName) {
        case 'EditProfile':
            response = await fetch('/Home/LoadTab_EditProfile', { method: 'POST' });
            break;

        case 'UploadMode':
            response = await fetch('/Home/LoadTab_UploadMode', { method: 'POST' });
            break;
    }

    html = await response.text();
    tabContainer.innerHTML = html;
    executeInjectedScripts(tabContainer); // this well just Execute the new loaded script inside the tabContainer.
}

// because how the browser is woking we need just to run createElement and copy 
// all the script from the container so the browser run them.
function executeInjectedScripts(container) {
    const scripts = container.querySelectorAll("script");

    scripts.forEach(oldScript => {
        const newScript = document.createElement("script");

        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });

        if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
        }

        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}