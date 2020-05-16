import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';

export interface Invoice {
  companyName?: string;
  companyAddress?: string;
  zipCode?: number;
  date?: string;
  receiptNo?: number;
  billTo?: BillTo;
  shipTo?: ShipTo;
  items?: Item[];
  notes?: string;
  subTotal?: number;
  discount?: number;
  subTotalLessDiscount?: number;
  taxRate?: number;
  totalTax?: number;
  shipping?: number;
  balancePaid?: number;
}

export interface BillTo {
  contactName?: string;
  clientCompanyName?: string;
  address?: string;
  phone?: number;
  email?: string;
}

export interface ShipTo {
  nameDep?: string;
  clientCompanyName?: string;
  address?: string;
  phone?: number;
}

export interface Item {
  description?: string;
  qty?: number;
  unitPrice?: number;
  total?: number;
}


@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  // this is a variable i use for DOM manipulation.
  update = false;

  // Object hold all inputs value
  invoice: Invoice = {
    items: [],
    shipping: null,
    taxRate: null,
    discount: null,
    shipTo: {
      phone: null,
      address: '',
      clientCompanyName: '',
      nameDep: ''
    },
    notes: '',
    billTo: {
      email: '',
      phone: null,
      address: '',
      clientCompanyName: '',
      contactName: ''
    },
    receiptNo: null,
    date: '',
    zipCode: null,
    companyAddress: '',
    companyName: '',
    balancePaid: null,
    subTotal: null,
    subTotalLessDiscount: null,
    totalTax: null
  };

  // this Object holds the item that will be added to the items array.
  itemContainer: Item = {};

  // this is a variable i use to store the current updated item in case the user canceled the update process.
  currentUpdatedItem: Item = {};

  constructor() {
  }

  ngOnInit() {
  }

  // takes an index and sp;ice it from items array.
  deleteItem(index) {
    if (confirm('do you want to delete this item..?')) {
      this.invoice.items.splice(index, 1);
      this.calculateBalancePaid();
    }

    if (this.invoice.items.length === 0) {
      this.resetItemOptions();
    }

  }

  // calculate total price of items
  getTotal() {
    if (this.itemContainer.qty !== 0 && this.itemContainer.unitPrice !== 0) {
      this.itemContainer.total = this.itemContainer.qty * this.itemContainer.unitPrice;
    } else {
      this.itemContainer.total = 0;
    }
  }

  // add new item
  addItem() {
    this.invoice.items.push(this.itemContainer);
    this.resetContainer();
    this.calculateBalancePaid();
  }

  // update existing item ** i could update the item in its index but i choose to delete
  // it and insert it again with the new values for a better performance [as updating existing array item is an O(n)]
  updateItem() {
    this.update = false;
    this.addItem();
  }

  // cancel updating
  cancel() {
    this.invoice.items.push(this.currentUpdatedItem);
    this.update = false;
    this.currentUpdatedItem = {};
    this.resetContainer();
  }

  // this is a method to fill item object with the item that needs to be updated
  fillContainer(index) {
    this.itemContainer = this.invoice.items[index];
    this.update = true;
    const {qty, description, unitPrice, total} = this.invoice.items[index];
    this.currentUpdatedItem.description = description;
    this.currentUpdatedItem.unitPrice = unitPrice;
    this.currentUpdatedItem.total = total;
    this.currentUpdatedItem.qty = qty;
    this.invoice.items.splice(index, 1);
  }

  // this method loops through the items and  calculates the subTotal price
  getSubTotal() {
    this.invoice.subTotal = 0;
    for (const item of this.invoice.items) {
      this.invoice.subTotal += item.total;
    }
  }

  // main method that calculates the balance paid
  calculateBalancePaid() { // formula = subtotal - discount + total tax + shipping
    this.getSubTotal();
    let discount;
    let totalTax;
    let shipping;
    let finalPrice;

    if (this.invoice.discount !== null) {
      // discount = this.invoice.subTotal - (this.invoice.subTotal * ((1 / 100) * this.invoice.discount)); // discount
      discount = this.invoice.subTotal - this.invoice.discount;
      discount = this.invoice.subTotal - discount;
      if (discount === this.invoice.subTotal) {
        discount = 0;
        this.invoice.subTotalLessDiscount = this.invoice.subTotal - discount;
        this.invoice.balancePaid = this.invoice.subTotalLessDiscount;
      } else {
        this.invoice.subTotalLessDiscount = this.invoice.subTotal - discount;
        this.invoice.balancePaid = this.invoice.subTotalLessDiscount;

      }
    } else {
      this.invoice.subTotalLessDiscount = this.invoice.subTotal;
    }

    if (this.invoice.taxRate !== null) {
      totalTax = this.invoice.subTotalLessDiscount * (this.invoice.taxRate * (1 / 100));
      this.invoice.totalTax = totalTax;
      console.log(totalTax);
    }

    if (this.invoice.shipping !== null) {
      shipping = this.invoice.shipping;
    }

    if (discount !== undefined && totalTax !== undefined && shipping !== undefined) {
      finalPrice = this.invoice.subTotal - discount + totalTax + Number(shipping); // main formula
      this.invoice.balancePaid = finalPrice;
      return;
    } else if (discount === undefined && totalTax !== undefined && shipping !== undefined) {
      finalPrice = this.invoice.subTotal + totalTax + shipping;
      this.invoice.balancePaid = finalPrice;
      return;
    } else if (discount === undefined && totalTax === undefined && shipping !== undefined) {
      finalPrice = this.invoice.subTotal + shipping;
      this.invoice.balancePaid = finalPrice;
    } else if (discount === undefined && totalTax === undefined && shipping === undefined) {
      finalPrice = this.invoice.subTotal;
      this.invoice.balancePaid = finalPrice;
    } else if (discount !== undefined && totalTax === undefined && shipping === undefined) {
      finalPrice = this.invoice.subTotal - discount;
      this.invoice.balancePaid = finalPrice;
    } else if (discount !== undefined && totalTax !== undefined && shipping === undefined) {
      finalPrice = this.invoice.subTotal - discount + totalTax; // main formula
      this.invoice.balancePaid = finalPrice;
    } else if (discount !== undefined && totalTax === undefined && shipping !== undefined) {
      finalPrice = this.invoice.subTotal - discount + shipping; // main formula
      this.invoice.balancePaid = finalPrice;
    }
  }

  // when import file selected it gets the file and pass it to the readFile() method
  fileSelected(e) {
    this.readFile(e.target.files[0]);
  }

  // reads file content and parse it to a json format.
  readFile(inputValue: any): void {
    const file: File = inputValue;
    const myReader: FileReader = new FileReader();
    myReader.onloadend = () => {
      const fileData = JSON.parse(myReader.result.toString());
      this.invoice = fileData;
    };
    myReader.readAsText(file);
  }

  // prompt a file name and pass it to exportAsJSON() method
  export() {
    const fileName = prompt('Enter File Name.. ');
    this.exportAsJSON(JSON.stringify(this.invoice), fileName + '.json');
  }

  // export all inpts to a JSON file.
  exportAsJSON(text, filename) {
    const a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-u,' + encodeURIComponent(text));
    a.setAttribute('download', filename);
    a.click();
  }

  // resets itemsContainer object
  resetContainer() {
    this.itemContainer = {};
  }


  // resets the item option (discount, shipping, taxRate, totalTax)
  resetItemOptions() {
    this.invoice.subTotalLessDiscount = null;
    this.invoice.shipping = null;
    this.invoice.discount = null;
    this.invoice.totalTax = null;
    this.invoice.taxRate = null;
  }


}
