module.exports = {
  makeid,
  validateData,
  validateNickname,
  validateOption,
};

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// TODO: Think about more ways to validate data
// Validating the maps sent by user
function validateData(startMap, currentMap, solvedColors) {
  // Validate if arrays are 2D
  if (!validate2d(startMap) && !validate2d(currentMap)) {
    return false;
  }

  // Check if both maps has the same size
  if (startMap.length != currentMap.length) {
    return false;
  }

  for (let y = 0; y < startMap.length; y++) {
    for (let x = 0; x < startMap.length; x++) {
      // Check if start and end points are placed correctly
      if (startMap[y][x] != 0) {
        if (startMap[y][x] != currentMap[y][x]) {
          return false;
        }
      }
    }
  }
}

function validate2d(map) {
  return map.every((item) => Array.isArray(item));
}

function validateNickname(socket) {
  if (socket.nickname == "") {
    socket.emit("displayAlert", {
      type: "error",
      text: "Nickname can not be empty!",
    });
    return false;
  } else if (socket.nickname.length <= 3) {
    socket.emit("displayAlert", {
      type: "error",
      text: "Nickname is too short!",
    });
    return false;
  } else if (socket.nickname.length > 15) {
    socket.emit("displayAlert", {
      type: "error",
      text: "Nickname is too long!",
    });
    return false;
  }
  return true;
}

function validateOption(value, socket) {
  const regex = /^[0-9]+$/;
  if (value == "") {
    socket.emit("displayAlert", {
      type: "error",
      text: "Options cannot be empty!",
    });
    return false;
  } else if (!regex.test(value)) {
    socket.emit("displayAlert", {
      type: "error",
      text: "Options can be integers only!",
    });
    return false;
  }
  return true;
}
