import { Response, Request } from "express";
import customer from "../types/customer.type";
import { promises as fsPromises } from "fs";
import path from "path";
import updateFiles from "../helperFunctions/updateFiles";

async function updateCustomers(req: Request, res: Response) {
  let latestUpdate: Date;
  let customerIdList: string;
  //fetching all customers from API1. This does not scale well but due to the structure of API1 I have to do this.
  let customersResponse = await fetch(
    "https://api1.example.com/api/v1/customer",
    {
      method: "GET",
      mode: "cors",
      headers: { Authorization: "example-api-key-1" },
    }
  );

  let customers: customer[] = await customersResponse.json();

  //Get the latest time a customer was updated. I use promise here because I need this information later on.
  const date = await fsPromises.readFile(
    path.join(__dirname, "latest_Customer_Update.txt"),
    "utf8"
  );
  latestUpdate = new Date(date);

  //Get the customer Id list for later comparisons. I use promise here because I need this information later on.
  customerIdList = await fsPromises.readFile(
    path.join(__dirname, "customer_Id_List.txt"),
    "utf8"
  );

  for (var i = 0; customers.length; i++) {
    //If customerIdList does not include a recieved customer from API1, then add that customer through the POST method.
    if (!customerIdList.includes(customers[i].id.toString())) {
      let addedCustomerResponse = await fetch(
        "https://api2.example.com/api/v1/customer",
        {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: "example-api-key-2",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customers[i]),
        }
      );

      let addedCustomer: customer = await addedCustomerResponse.json();

      customerIdList += addedCustomer.id.toString() + "\n";
    }
    //If the customer exists but the updated_at property is later than latestUpdate, then update that customer through the PUT method
    else if (customers[i].updated_at > latestUpdate) {
      let addedCustomerResponse = await fetch(
        `https://api2.example.com/api/v1/customer/${customers[i].id}`,
        {
          method: "PUT",
          mode: "cors",
          headers: {
            Authorization: "example-api-key-2",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customers[i]),
        }
      );

      //Important to not update latestUpdate variable yet since there could be more updated customers
    }
    //Else, check if a customer has been deleted. If so, delete that customer through the DELETE method.
    else {
      let customerIdArrayList = customerIdList.split("\n");
      //There are probably more effective ways to do this since this is O(n^2)
      for (var i = 0; customerIdArrayList.length; i++) {
        for (var k = 0; customers.length; k++) {
          if (customerIdArrayList[i] === customers[k].id.toString()) {
            continue;
          } else {
            //This code block is for when we know there is a deleted customer

            let deletedCustomerResponse = await fetch(
              `https://api2.example.com/api/v1/customer/${customers[
                k
              ].id.toString()}`,
              {
                method: "DELETE",
                mode: "cors",
                headers: {
                  Authorization: "example-api-key-2",
                },
              }
            );

            let deletedCustomer: customer =
              await deletedCustomerResponse.json();

            console.log("Deleted customer: ", deletedCustomer);

            //Remove the deleted customer from the customerIdArrayList and customer array
            customerIdArrayList.splice(i, 1);
            customers.splice(k, 1);

            //Re-create an updated string of id:s with "\n" seperating each of them
            customerIdList = customerIdArrayList.join("\n");
          }
        }
      }
    }

    //find the new value for latest updateded customer.
    //Here it should be safe to update the latestUpdate variable since we already have looped through all customers.
    latestUpdate = new Date(1);
    for (var i = 0; customers.length; i++) {
      if (customers[i].updated_at > latestUpdate) {
        latestUpdate = customers[i].updated_at;
      }
    }

    //Update the files for the next refresh
    updateFiles(latestUpdate, customerIdList);
  }
}

export default updateCustomers;
