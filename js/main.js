'use strict'

var gBoard
var gLevels = [
    { SIZE: 4, MINES: 2 },
    { SIZE: 8, MINES: 12 },
    { SIZE: 12, MINES: 30 }
]
var gLevel
var gGame = {
    isOn: false,
    shownCount: 0,
    mineShownCount: 0,
    markedCount: 0,
    lives: 3
    // secsPassed: 0
}
var gEmptyCells
var gMinesRandomPositions
var gSeconds = 0
var gMinute = 0
var gTimerID

const EMPTY = ''
const MINE = '💣'
const FLAG = '🚩'

//disabeling right click menu inside board div
const noRightClick = document.querySelector(".board-container")
noRightClick.addEventListener("contextmenu", e => e.preventDefault())

function initGame(level) {
    gGame.isOn = false
    gGame.lives = 3
    gGame.mineShownCount = 0
    gGame.shownCount = 0
    gGame.markedCount = 0
    pauseTimer()
    resetTimer()
    if (level === 0 || level === 1 || level === 2) gLevel = gLevels[level]
    var elSmiley = document.querySelector('.smiley')
    elSmiley.innerHTML = '😀'
    var elLives = document.querySelectorAll('.lives')
    for (var i = 0; i < 3; i++) {
        elLives[i].innerHTML = '❤️'
        elLives[i].classList.add('life')
    }
    var elHints = document.querySelectorAll('.hint')
    for (var i = 0; i < 3; i++) {
        elHints[i].innerHTML = '💡'
        elHints[i].classList.add('hint')
    }
    gBoard = buildBoard()
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
}

function buildBoard() {
    var size = gLevel.SIZE;
    var board = [];
    var gEmptyCells = []
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            gEmptyCells.push({ i, j })
        }
    }

    // Locating Mines Randomly
    gMinesRandomPositions = []
    for (var k = 0; k < gLevel.MINES; k++) {
        var idx = getRandomIntExclusive(0, gEmptyCells.length)
        var pos = gEmptyCells.splice(idx, 1)
        gMinesRandomPositions.push(pos[0])
        var rowIdx = gMinesRandomPositions[k].i
        var colIdx = gMinesRandomPositions[k].j
        board[rowIdx][colIdx].isMine = true
    }
    // console.log('gMinesRandomPositions:', gMinesRandomPositions)
    return board;
}

function renderBoard(mat) {
    var strHTML = '<table border="2"><tbody>';
    for (var i = 0; i < mat.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < mat[0].length; j++) {
            var cell = mat[i][j]
            var className = `cell cell-${i}-${j}`
            strHTML += `\t<td class="${className} "
             onclick="cellClicked(this, ${i}, ${j})"
              oncontextmenu="cellMarked(this, ${i}, ${j})"></td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector('.board-container')
    elContainer.innerHTML = strHTML;
}

function cellClicked(elCell, i, j) {
    var cell = gBoard[i][j]
    if (cell.isMarked || cell.isShown) return
    //GAME OFF
    if (!gGame.isOn) {
        if (!cell.isShown && gGame.shownCount === 0) {
            startTimer()
            gGame.isOn = true
            renderCell(cell, elCell, i, j)
        }
        else return
    }
    //GAME ON
    else {
        renderCell(cell, elCell, i, j)
        checkGameOver()
    }
}

//renders non flag cells when clicked (vacant or mines)
function renderCell(cell, elCell, i, j) {
    cell.isShown = true
    if (!cell.isMine) {
        gGame.shownCount++
        elCell.innerText = (cell.minesAroundCount !== 0) ? cell.minesAroundCount : ''
        elCell.style.backgroundColor = 'rgb(124, 124, 121)'
        expandShown(gBoard, elCell, i, j)
    }
    else {
        if (gGame.lives !== 0) {
            gGame.lives--
            gGame.mineShownCount++
            renderMine(elCell)
            var elLife = document.querySelector('.life')
            elLife.innerHTML = '🖤'
            elLife.classList.remove('life')
        }
        else {
            gGame.isOn = false
            renderMine(elCell)
            var elSmiley = document.querySelector('.smiley')
            elSmiley.innerHTML = '🤯'
            showAllMines(gBoard, elCell)
        }
    }
}

function renderMine(elCell) {
    elCell.innerText = MINE
    elCell.style.backgroundColor = 'rgb(216, 216, 194)'
}

function showAllMines(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine) continue
            else if (!board[i][j].isShown) {
                var elCell = document.querySelector(`.cell-${i}-${j}`)
                renderMine(elCell)
                board[i][j].isShown = true
            }
        }
    }
    console.log('YOU LOOSE')
    gGame.isOn = false
    pauseTimer()
}

function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j]
    if (cell.isShown) return
    //GAME OFF
    if (!gGame.isOn) {
        if (!cell.isMarked && gGame.shownCount === 0) {
            startTimer()
            gGame.isOn = true
            markFlag(cell, elCell)
        }
        else return
    }
    //GAME ON
    else {
        if (!cell.isMarked) {
            markFlag(cell, elCell)
            checkGameOver()
        }
        else {
            cell.isMarked = false
            gGame.markedCount--
            elCell.innerText = EMPTY
        }
    }
}

function markFlag(cell, elCell) {
    cell.isMarked = true
    gGame.markedCount++
    elCell.innerText = FLAG
}

function checkGameOver() {
    var emptyCellsCount = (gLevel.SIZE ** 2) - gLevel.MINES
    if ((gGame.markedCount === gLevel.MINES &&
        gGame.shownCount === emptyCellsCount) ||
        (gGame.shownCount === emptyCellsCount &&
            (gGame.markedCount + gGame.mineShownCount === gLevel.MINES))) {
        console.log('YOU WON')
        var elSmiley = document.querySelector('.smiley')
        elSmiley.innerHTML = '😎'
        gGame.isOn = false
        pauseTimer()
    }
}

function expandShown(board, elCell, i, j) {
    if (board[i][j].minesAroundCount !== 0) return
    else {
        var negs = findNegs(board, i, j)
        for (var k = 0; k < negs.length; k++) {
            var cellPos = negs[k]
            var cell = gBoard[negs[k].i][negs[k].j]
            if (cell.isShown || cell.isMarked) continue
            else
                renderCell(cell, document.querySelector(`.cell-${negs[k].i}-${negs[k].j}`), negs[k].i, negs[k].j)
        }
    }
}

// //returns an array of negs with location {i,j} to expend
function findNegs(mat, rowIdx, colIdx) {
    var negs = [];
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > mat.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > mat[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            if (mat[i][j].isShown) continue
            var neg = { i, j };
            negs.push(neg);
        }
    }
    return negs;
}

//Sets every cell's minesAroundCount on the model 
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var minesNegsCount = countMineNegs(board, i, j)
            gBoard[i][j].minesAroundCount = minesNegsCount
        }
    }
}

//Returns the number of mines around every cell
function countMineNegs(mat, rowIdx, colIdx) {
    var count = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > mat.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > mat[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            var cell = mat[i][j]
            if (cell.isMine) count++
        }
    }
    return count;
}

function getRandomIntExclusive(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function safeClicked(elBtn) {
    if (elBtn.innerHTML !== '❌') {
        var emptyCells = getEmptyCells(gBoard)
        if (emptyCells[0] && gGame.isOn) {
            var randomIDx = getRandomIntExclusive(0, emptyCells.length)
            var rowIdx = emptyCells[randomIDx].i
            var colIdx = emptyCells[randomIDx].j
            var cellReveled = gBoard[rowIdx][colIdx]
            var elCellREveled = document.querySelector(`.cell-${rowIdx}-${colIdx}`)
            elCellREveled.classList.toggle('reveled')
            var timeOutID = setTimeout(function () { elCellREveled.classList.remove('reveled'); }, 1000)
            elBtn.innerHTML = '❌'
        }
    }
}

function getEmptyCells(board) {
    var emptyCells = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine && !board[i][j].isShown)
                emptyCells.push({ i, j })
        }
    }
    return emptyCells
}

//*  TIMER
function timer() {
    gSeconds += 1
    if (gSeconds === 60) {
        gSeconds = 0;
        gMinute++;
    }
    document.querySelector('.second').innerText = returnData(gSeconds);
    document.querySelector('.minute').innerText = returnData(gMinute);
}

function returnData(input) {
    return (input >= 10) ? input : `0${input}`
}

function startTimer() {
    resetTimer()
    gTimerID = setInterval(function () { timer() }, 1000)
}

function resetTimer() {
    gSeconds = 0;
    gMinute = 0
    document.querySelector('.second').innerText = '00';
    document.querySelector('.minute').innerText = '00'
}

function pauseTimer() {
    clearInterval(gTimerID);
}

