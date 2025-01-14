const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const scoreElement = document.getElementById('score');

ctx.scale(20, 20);

let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;
let score = 0;
let requestId;
let audio = new Audio('03. A-Type Music (Korobeiniki).mp3');

// Set the volume of the audio
audio.volume = 0.1; // Set to 10% volume. Adjust this value as needed.

const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
  ];

const arena = createMatrix(12, 20);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
  }
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  if (type === 'T') {
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  } else if (type === 'J') {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ];
  } else if (type === 'I') {
    return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

// Function to draw the playfield and the active piece
function draw() {
    // Clear the canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the playfield from the arena state
    drawMatrix(arena, {x: 0, y: 0});
    // Draw the active piece
    drawMatrix(player.matrix, player.pos);
  }  

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - (player.matrix[0].length / 2 | 0);

  // If we collide on reset, it's game over
  if (collide(arena, player)) {
    // Update the score display before showing the game over alert
    updateScore();
    alert("Game Over! Your score was: " + player.score);
    finalScore = player.score;
    // Show the score form
    document.getElementById('final-score').textContent = player.score;
    document.getElementById('score-form').style.display = 'block';

    arena.forEach(row => row.fill(0));
    player.score = 0;
    cancelAnimationFrame(requestId);
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestId = requestAnimationFrame(update);
}

function updateScore() {
  scoreElement.innerText = player.score;
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) { // Left arrow
      playerMove(-1);
    } else if (event.keyCode === 39) { // Right arrow
      playerMove(1);
    } else if (event.keyCode === 40) { // Down arrow
      playerDrop();
    } else if (event.keyCode === 38) { // Up arrow
      playerRotate(1); // Assuming 1 rotates clockwise
    } else if (event.keyCode === 32) { // Spacebar
      playerDropToBottom();
    }
  });
  
  function playerDropToBottom() {
    while (!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
    updateScore();
    dropCounter = 0;
  }

startButton.addEventListener('click', () => {
  if (requestId) {
    cancelAnimationFrame(requestId);
  }
  playerReset();
  updateScore();
  update();
  audio.play();
  startButton.style.display = 'none';
});
resetButton.addEventListener('click', () => {
  location.reload();
});


function submitScore() {
  const playerName = document.getElementById('player-name').value;
  const score = player.score;

  console.log('Player:', player); // Debugging statement
  console.log('Final Score:', finalScore); // Debugging statement

  const params = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'playername': playerName,
      'score': String(finalScore)
    })
  };

  fetch('https://h44odcd5eh.execute-api.us-east-1.amazonaws.com/Production/main', params)
    .then(response => response.json())
    .then(data => {
      console.log('Score submitted:', data);
      // Hide the score form
      document.getElementById('score-form').style.display = 'none';
      // Call displayHighScores to show the high scores
      displayHighScores();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

const instructionsButton = document.getElementById("instructions");
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0]; // This gets an HTMLCollection, you need the first item

// When the user clicks on the button, open the modal 
instructionsButton.addEventListener("click", () => {
  modal.style.display = "block";
});

// When the user clicks on <span> (x), close the modal
span.addEventListener("click", () => {
  modal.style.display = "none";
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
// High Scores Button Setup
// Get a reference to the button
var highScoresButton = document.getElementById('high-scores');

// Add a click event listener to the button
highScoresButton.addEventListener('click', function() {
  fetch('https://h44odcd5eh.execute-api.us-east-1.amazonaws.com/Production/main')
  .then(response => response.json())
  .then(data => {
    console.log('High scores fetched successfully: ', data);
    // Get a reference to the element where you want to display the high scores
    var highScoresList = document.getElementById('high-scores-list');
    // Clear any existing high scores
    highScoresList.innerHTML = '';
    // Check if data.Items is an array before trying to use forEach on it
    if (Array.isArray(data.Items)) {
      // Sort the items in descending order of score
      data.Items.sort((a, b) => b.score - a.score);
      // Add each high score to the list
      data.Items.forEach((item, index) => {
        var listItem = document.createElement('li');
        listItem.textContent = item.playername + ": " + item.score;
        // If this is the top score, make the text bold
        if (index === 0) {
          listItem.style.fontWeight = 'bold';
          listItem.style.color = 'gold';
        }
        highScoresList.appendChild(listItem);
      });
    } else {
      console.error('data.Items is not an array: ', data.Items);
    }
  })
  .catch((error) => console.error('Error:', error));
});

// AWS SDK Configuration
AWS.config.update({
  region: 'us-east-1'
});

const docClient = new AWS.DynamoDB.DocumentClient();


// Prompt for Name and Submit High Score
function displayHighScores() {
  var params = {
    TableName: "fantastic_5",
    IndexName: "ScoreIndex",
    ExpressionAttributeNames: {
      "#score": "Score"
    },
    ProjectionExpression: "#score, playername",
    ScanIndexForward: false,
    Limit: 10
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      var highScoresContainer = document.getElementById('high-scores-list');
      highScoresContainer.innerHTML = ''; // Clear previous content

      var table = document.createElement('table');
      var thead = document.createElement('thead');
      var tbody = document.createElement('tbody');
      var headerRow = document.createElement('tr');

      // Define table headers
      ['Player Name', 'Score'].forEach(headerText => {
        var header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Populate table rows with high scores data
      data.Items.forEach(item => {
        var row = document.createElement('tr');
        var nameCell = document.createElement('td');
        nameCell.textContent = item.playername;
        var scoreCell = document.createElement('td');
        scoreCell.textContent = item.score;

        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      highScoresContainer.appendChild(table);
    }
  });
}
