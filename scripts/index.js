const flipCard = document.getElementsByClassName("flip-card-inner")[0]
let deg = 0
let pageNum = 0
const pageCount = pages.length
const degDenied = 20
const degDeniedInterval = 300

function rotateFlipCard(d) {
    deg += d
    flipCard.style.tranform = `rotateY(${deg}deg)`;
    flipCard.style.msTransform = `rotateY(${deg}deg)`;
    flipCard.style.webkitTransform = `rotateY(${deg}deg)`;
}

function goNext(){
    if(pageNum === pageCount - 1){
        rotateFlipCard(-degDenied)
        let animInterval = setTimeout(() => {rotateFlipCard(degDenied); clearInterval(animInterval)}, degDeniedInterval)
        return
    }
    pageNum += 1;
    setupFace(pages[pageNum])
    rotateFlipCard(-180);
}

function goPrev(){
    if(pageNum === 0){
        rotateFlipCard(degDenied)
        let animInterval = setTimeout(() => {rotateFlipCard(-degDenied); clearInterval(animInterval)}, degDeniedInterval)
        return
    }
    pageNum -= 1;
    setupFace(pages[pageNum])
    rotateFlipCard(180);
}

function setBackfaceHTML(html){
    document.querySelector(".flip-card-back").innerHTML = html;
}

function setFrontfaceHTML(html){
    document.querySelector(".flip-card-front").innerHTML = html;
}

function setupFace (html){
    if(pageNum % 2 === 0){
        setFrontfaceHTML(html)
    }
    else {
        setBackfaceHTML(html)
    }
}

window.addEventListener("load", () => {
    setupFace(pages[pageNum])
})