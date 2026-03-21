import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Time "mo:base/Time";

actor {
  type Product = {
    id: Nat;
    name: Text;
    description: Text;
    price: Nat;
    category: Text;
    image: Text;
  };

  type Order = {
    id: Nat;
    customerName: Text;
    phone: Text;
    address: Text;
    productId: Nat;
    productName: Text;
    price: Nat;
    timestamp: Int;
  };

  stable var nextOrderId: Nat = 1;
  stable var orders: [Order] = [];

  let products: [Product] = [
    { id = 1; name = "Banarasi Silk Saree"; description = "Elegant handwoven Banarasi silk saree with golden zari work"; price = 450000; category = "Sarees"; image = "" },
    { id = 2; name = "Designer Lehenga Choli"; description = "Stunning bridal lehenga with heavy embroidery and mirror work"; price = 850000; category = "Lehengas"; image = "" },
    { id = 3; name = "Anarkali Suit Set"; description = "Beautiful anarkali suit with dupatta, perfect for occasions"; price = 320000; category = "Suits"; image = "" },
    { id = 4; name = "Men's Sherwani"; description = "Royal sherwani set for weddings and festive occasions"; price = 680000; category = "Men's Wear"; image = "" }
  ];

  public query func getProducts(): async [Product] {
    products
  };

  public func placeOrder(customerName: Text, phone: Text, address: Text, productId: Nat, productName: Text, price: Nat): async Nat {
    let order: Order = {
      id = nextOrderId;
      customerName;
      phone;
      address;
      productId;
      productName;
      price;
      timestamp = Time.now();
    };
    orders := Array.append(orders, [order]);
    let orderId = nextOrderId;
    nextOrderId += 1;
    orderId
  };

  public query func getOrders(): async [Order] {
    orders
  };
}
