const tiptext = document.querySelector('.flashtext');

function myFunction() {
    setTimeout(function () {
        tiptext.style.display = 'none';
    }, 3000);
}
myFunction();