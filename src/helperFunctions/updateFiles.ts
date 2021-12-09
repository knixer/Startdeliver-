import fs from "fs";
import path from "path";

function updateFiles(latestUpdate: Date, customerIdList: string) {
  //Update latest customer update date
  fs.writeFile(
    path.join(__dirname, "latest_Customer_Update.txt"),
    latestUpdate.toDateString(),
    (err) => {
      if (err) throw err;
    }
  );

  //Uptade the customer_Id_List.txt file.
  fs.writeFile(
    path.join(__dirname, "customer_Id_List.txt"),
    customerIdList,
    (err) => {
      if (err) throw err;
    }
  );

  // if an error was thrown from writing to a file
  process.on("uncaughtException", (err) => {
    console.error("updateFiles :: error :: ", err);
  });
}

export default updateFiles;
