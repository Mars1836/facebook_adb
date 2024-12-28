const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const {
  getCenterCoordinates,
  parseXMLToNodeArray,
  convertBoundsToCoordinates,
  convertStringBoundsToBounds,
} = require("./utils");
const listIcon = [
  "Thích",
  "Yêu thích",
  "Thương thương",
  "Haha",
  "Wow",
  "Buồn",
  "Phẫn nộ",
];
let chooseIconIndex = 0;
const saveDumpToFile = async (dumpContent) => {
  try {
    const filePath = path.join(__dirname, "window_dump.xml");

    // Kiểm tra xem file đã tồn tại hay chưa
    if (!fs.existsSync(filePath)) {
      // Nếu chưa có, lưu dump vào file
      fs.writeFileSync(filePath, dumpContent);
      console.log("Đã lưu nội dung dump vào file window_dump.xml");
    } else {
      console.log("File dump đã tồn tại, không lưu lại.");
    }
  } catch (error) {
    console.error("Lỗi khi lưu dump vào file:", error);
  }
};

// Hàm thực thi lệnh ADB
const runAdbCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Lỗi: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

// Hàm tìm phần tử theo nhiều tiêu chí
const findElement = async (criteria) => {
  try {
    let command =
      "adb shell uiautomator dump && adb shell cat /sdcard/window_dump.xml";
    const dump = await runAdbCommand(command);
    const cleanDump = dump.split("\n").slice(1).join("\n");
    const nodes = await parseXMLToNodeArray(cleanDump);
    const node = nodes.find((node) => {
      return Object.keys(criteria).every((key) => node[key] === criteria[key]);
    });
    if (!node) {
      throw new Error("Không tìm thấy phần tử", criteria);
    }
    const coordinates = getCenterCoordinates(node.bounds);
    return coordinates;
  } catch (error) {
    console.error(error);
  }
};
const findElementBounds = async (criteria) => {
  try {
    let command =
      "adb shell uiautomator dump && adb shell cat /sdcard/window_dump.xml";
    const dump = await runAdbCommand(command);
    const cleanDump = dump.split("\n").slice(1).join("\n");
    const nodes = await parseXMLToNodeArray(cleanDump);
    const node = nodes.find((node) => {
      return Object.keys(criteria).every((key) => node[key] === criteria[key]);
    });
    if (!node) {
      throw new Error("Không tìm thấy phần tử", criteria);
    }
    const coordinates = convertStringBoundsToBounds(node.bounds);
    return coordinates;
  } catch (error) {
    console.error(error);
  }
};

// Hàm đợi và click vào phần tử
const waitAndClick = async (criteria, maxAttempts = 20, interval = 100) => {
  try {
    for (let i = 0; i < maxAttempts; i++) {
      const element = await findElement(criteria);
      if (element) {
        await tapScreen(...element);

        return true;
      }
      await delay(interval);
      console.log(`Lần thử ${i + 1} thất bại`);
    }
    return false;
  } catch (error) {
    console.error(error);
  }
};
const waitAndClickIcon = async (
  criteria,
  maxAttempts = 20,
  interval = 100,
  part = 0
) => {
  const element = await findElementBounds(criteria);
  if (element) {
    const width = element[0][0] - element[1][0];
    const height = element[0][1] - element[1][1];
    const centerX =
      (element[0][0] + element[1][0]) / 2 + (3 - part) * (width / 6);
    const centerY = (element[0][1] + element[1][1]) / 2;
    console.log("part", part, centerX, centerY);
    await tapScreen(centerX, centerY);
    return { x: centerX, y: centerY };
  }
  return false;
};
const waitAndHold = async (
  criteria,
  duration,
  maxAttempts = 20,
  interval = 100
) => {
  try {
    for (let i = 0; i < maxAttempts; i++) {
      const element = await findElement(criteria);
      if (element) {
        await holdScreen(...element, duration);

        return [element[0], element[1]];
      }
      await delay(interval);
    }
    return false;
  } catch (error) {
    console.error(error);
  }
};

// Hàm nhấn vào màn hình
const tapScreen = async (x, y) => {
  console.log(`Nhấn vào tọa độ: ${x}, ${y}`);
  await runAdbCommand(`adb shell input tap ${x} ${y}`);
};
const holdScreen = async (x, y, duration) => {
  console.log(`Giữ tại tọa độ: ${x}, ${y} trong ${duration}ms`);
  // Giữ tại tọa độ (x, y) trong thời gian 'duration' (mili giây)
  await runAdbCommand(`adb shell input swipe ${x} ${y} ${x} ${y} ${duration}`);
  console.log(`Đã giữ tại tọa độ (${x}, ${y}) trong ${duration}ms`);
};

const inputText = async (text) => {
  try {
    await runAdbCommand(`adb shell input text "${text}"`);
    console.log("Đã nhập văn bản!");
  } catch (error) {
    console.error(error);
  }
};
const swipeScreen = async (x1, y1, x2, y2, duration = 500) => {
  try {
    console.log(`Vuốt màn hình từ (${x1}, ${y1}) đến (${x2}, ${y2})...`);
    await runAdbCommand(
      `adb shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`
    );
    console.log("Đã vuốt màn hình!");
  } catch (error) {
    console.error(error);
  }
};
const openFacebook = async () => {
  try {
    console.log("Mở ứng dụng Facebook...");
    await runAdbCommand(
      "adb shell monkey -p com.facebook.katana -c android.intent.category.LAUNCHER 1"
    );
    console.log("Đã mở ứng dụng Facebook!");
  } catch (error) {
    console.error(error);
  }
};
// Hàm delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function slipAndLikePost() {
  const loop = 20;
  for (let i = 0; i < loop; i++) {
    await swipeScreen(100, 400, 100, 100, 500);
    await waitAndClick(
      {
        className: "android.view.ViewGroup",
        contentDesc: "Thích. Nhấn đúp và giữ để bày tỏ cảm xúc.",
      },
      1,
      100
    );
  }
}
async function slipAndIconToPost() {
  const loop = 100;
  let locationIconPost = [];
  for (let i = 0; i < loop; i++) {
    locationIconPost = await waitAndHold(
      {
        className: "android.view.ViewGroup",
        contentDesc: "Thích. Nhấn đúp và giữ để bày tỏ cảm xúc.",
        clickable: true,
      },
      300,
      1,
      100
    );
    if (!locationIconPost) {
      await swipeScreen(100, 900, 100, 0, 400);
      continue;
    }
    let found = await waitAndClickIcon(
      {
        className:
          "com.facebook.feedback.sharedcomponents.reactions.dock.RopeStyleUFIDockView",
        contentDesc: listIcon[chooseIconIndex],
      },
      1,
      100,
      chooseIconIndex
    );
    if (!found) {
      continue;
    }
    await commentPost(locationIconPost);
    chooseIconIndex++;
    if (chooseIconIndex >= listIcon.length) {
      chooseIconIndex = 0;
    }
  }
}
async function commentPost(locate) {
  let x = locate[0] + 200;
  let y = locate[1];
  await tapScreen(x, y);

  await inputText("comment");
  await waitAndClick({
    contentDesc: "Gửi",
    className: "android.view.ViewGroup",
  });
  // await delay(1000);
  await swipeScreen(0, 400, 400, 400, 200);
}
// Ví dụ sử dụng
async function loginToFacebook() {
  // Mở ứng dụng Facebook
  await openFacebook();

  // Đợi và click vào nút "Đăng nhập tài khoản khác"
  const found = await waitAndClick({
    contentDesc: "Đăng nhập bằng tài khoản khác",
    className: "android.widget.Button",
  });
  let checkGoogleHeader = 10;
  while (checkGoogleHeader > 0) {
    const googleHeader = await findElement({
      resourceId: "com.google.android.gms:id/header_with_logo_no_text",
      className: "android.widget.LinearLayout",
    });
    if (googleHeader) {
      console.log("Tìm thấy header google");
      await swipeScreen(200, 500, 200, 700, 400);
      break;
    }
    checkGoogleHeader--;
    await delay(500);
  }

  await waitAndClick({
    text: "Số di động hoặc email",
    className: "android.view.View",
  });
  await inputText(process.env.EMAIL);
  await waitAndClick({
    text: "Mật khẩu",
    className: "android.view.View",
  });
  await inputText(process.env.PASSWORD);
  await waitAndClick({
    text: "Đăng nhập",
    className: "android.view.View",
    contentDesc: "Đăng nhập",
  });
}
(async () => {
  // 1. Mở Facebook
  console.log("Mở Facebook...");

  await loginToFacebook();
  //   await slipAndLikePost();
  await slipAndIconToPost();
  console.log("Hoàn tất!");
})();
