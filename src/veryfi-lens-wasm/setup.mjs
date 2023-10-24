import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";

const defaultPath = path.join(process.cwd());

const questions = [
  {
    type: "input",
    name: "targetPath",
    message: `Enter the path where you want to copy WASM files (They have to be accessible to the browser with relative path)
        current: ${defaultPath} + /public/wasm (you are changing what goes after +):`,
    default: defaultPath + "/public/wasm",
  },
  {
    type: "confirm",
    name: "confirmCopy",
    message: "Do you want to proceed with the copying?",
    default: true,
  },
];

inquirer
  .prompt(questions)
  .then((answers) => {
    if (answers.confirmCopy) {
      const sourcePath = path.join(
        process.cwd(),
        "node_modules/veryfi-lens-wasm/src/wasm"
      );
      const targetPath = path.isAbsolute(answers.targetPath)
        ? answers.targetPath
        : path.join(process.cwd(), answers.targetPath);

      fs.copySync(sourcePath, targetPath, { overwrite: true });
      console.log("WASM files copied successfully.");
    } else {
      console.log("WASM files were not copied.");
    }
  })
  .catch((error) => {
    if (error.isTtyError) {
      console.error("Prompt couldn't be rendered in the current environment.");
    } else {
      console.error("An error occurred:", error);
    }
  });
