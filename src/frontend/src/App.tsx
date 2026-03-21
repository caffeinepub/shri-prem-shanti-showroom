import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  Store,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { useActor } from "./hooks/useActor";

// --- Types ---
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
}

type CheckoutStep = "idle" | "form" | "payment" | "success";

// --- Product Data ---
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Banarasi Silk Saree",
    price: 4500,
    image: "/assets/generated/saree.dim_600x600.jpg",
    description: "Pure Banarasi silk with intricate gold zari work",
    category: "Sarees",
  },
  {
    id: 2,
    name: "Designer Lehenga Choli",
    price: 8500,
    image: "/assets/generated/lehenga.dim_600x600.jpg",
    description: "Embroidered designer lehenga for special occasions",
    category: "Lehengas",
  },
  {
    id: 3,
    name: "Anarkali Suit Set",
    price: 3200,
    image: "/assets/generated/suit.dim_600x600.jpg",
    description: "Elegant Anarkali with dupatta, perfect for festivities",
    category: "Suits",
  },
  {
    id: 4,
    name: "Men's Sherwani",
    price: 6800,
    image: "/assets/generated/sherwani.dim_600x600.jpg",
    description: "Royal sherwani with intricate embroidery for weddings",
    category: "Sherwanis",
  },
];

// --- Razorpay types ---
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// --- WhatsApp helper ---
function getWhatsAppLink(product: Product): string {
  const text = encodeURIComponent(
    `I want to order ${product.name} priced at ₹${product.price.toLocaleString("en-IN")}`,
  );
  return `https://wa.me/919999999999?text=${text}`;
}

// --- Product Card ---
function ProductCard({
  product,
  onBuyNow,
  index,
}: {
  product: Product;
  onBuyNow: (product: Product) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
      data-ocid={`product.item.${index + 1}`}
    >
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
          {product.category}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-semibold text-foreground text-base leading-tight">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {product.description}
          </p>
        </div>
        <div className="mt-auto">
          <p className="text-primary font-bold text-xl mb-3">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all"
              onClick={() => onBuyNow(product)}
              data-ocid={`product.primary_button.${index + 1}`}
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              BUY NOW
            </Button>
            <a
              href={getWhatsAppLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid={`product.secondary_button.${index + 1}`}
            >
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-green-500 text-green-600 hover:bg-green-50 shrink-0"
                title="Order via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Checkout Modal ---
function CheckoutModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<CheckoutStep>("form");
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { actor } = useActor();

  const validate = useCallback(() => {
    const errs: Partial<CheckoutForm> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid 10-digit phone number";
    if (!form.address.trim()) errs.address = "Address is required";
    return errs;
  }, [form]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setStep("payment");
    },
    [validate],
  );

  const handlePayment = useCallback(async () => {
    if (!product) return;
    setIsLoading(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load payment gateway. Please try again.");
      setIsLoading(false);
      return;
    }

    const options = {
      key: "rzp_test_1DP5mmOlF5G5ag",
      amount: product.price * 100,
      currency: "INR",
      name: "Shri Prem Shanti Showroom",
      description: product.name,
      handler: async (response: any) => {
        // Log order details
        const orderDetails = {
          customerName: form.name,
          phone: form.phone,
          address: form.address,
          product: product.name,
          price: product.price,
          razorpayPaymentId: response.razorpay_payment_id,
        };
        console.log("[Order Placed]", orderDetails);

        // Call backend
        try {
          await (actor as any)?.placeOrder(
            form.name,
            form.phone,
            form.address,
            BigInt(product.id),
            product.name,
            BigInt(product.price),
          );
        } catch (err) {
          console.error("Backend order placement error:", err);
        }

        setStep("success");
        setIsLoading(false);
      },
      prefill: {
        name: form.name,
        contact: form.phone,
      },
      theme: {
        color: "#E07722",
      },
      modal: {
        ondismiss: () => setIsLoading(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsLoading(false);
  }, [product, form, actor]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="checkout.modal"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-xs uppercase tracking-widest">
              Checkout
            </p>
            <h2 className="text-primary-foreground font-bold text-lg">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            data-ocid="checkout.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Product summary */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-muted rounded-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div>
              <p className="font-semibold text-sm">{product.name}</p>
              <p className="text-primary font-bold">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleFormSubmit}
                className="space-y-4"
              >
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium flex items-center gap-1.5 mb-1.5"
                  >
                    <User className="w-3.5 h-3.5" /> Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className={errors.name ? "border-destructive" : ""}
                    data-ocid="checkout.input"
                  />
                  {errors.name && (
                    <p
                      className="text-destructive text-xs mt-1"
                      data-ocid="checkout.error_state"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium flex items-center gap-1.5 mb-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className={errors.phone ? "border-destructive" : ""}
                    data-ocid="checkout.input"
                  />
                  {errors.phone && (
                    <p
                      className="text-destructive text-xs mt-1"
                      data-ocid="checkout.error_state"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium flex items-center gap-1.5 mb-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Delivery Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full delivery address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className={`resize-none ${errors.address ? "border-destructive" : ""}`}
                    rows={3}
                    data-ocid="checkout.textarea"
                  />
                  {errors.address && (
                    <p
                      className="text-destructive text-xs mt-1"
                      data-ocid="checkout.error_state"
                    >
                      {errors.address}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full py-5"
                  data-ocid="checkout.submit_button"
                >
                  Continue to Payment
                </Button>
              </motion.form>
            )}

            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{form.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{form.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {form.address}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 text-base"
                  data-ocid="checkout.primary_button"
                >
                  {isLoading ? "Loading..." : "🔒 Proceed to Payment"}
                </Button>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setStep("form")}
                  data-ocid="checkout.cancel_button"
                >
                  ← Edit Details
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
                data-ocid="checkout.success_state"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">
                  Order placed successfully!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Thank you, {form.name}! Your order for{" "}
                  <strong>{product.name}</strong> has been placed. We'll contact
                  you at {form.phone}.
                </p>
                <Button
                  onClick={onClose}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                  data-ocid="checkout.confirm_button"
                >
                  Continue Shopping
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleBuyNow = useCallback((product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="bg-white shadow-xs sticky top-0 z-40">
        {/* Tier 1: Brand */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-tight">
              Shri Prem Shanti Showroom
            </h1>
            <p className="text-muted-foreground text-xs">
              Premium Indian Ethnic Wear
            </p>
          </div>
        </div>
        {/* Tier 2: Nav */}
        <nav
          className="bg-secondary px-4 py-2 flex items-center gap-6 overflow-x-auto"
          data-ocid="nav.panel"
        >
          {["Home", "Sarees", "Lehengas", "Suits", "Sherwanis", "Offers"].map(
            (item) => (
              <a
                key={item}
                href="#products"
                className="text-sm font-medium text-foreground/80 hover:text-primary whitespace-nowrap transition-colors"
                data-ocid="nav.link"
              >
                {item}
              </a>
            ),
          )}
        </nav>
      </header>

      {/* ===== HERO BANNER ===== */}
      <section className="relative overflow-hidden">
        <div
          className="h-64 sm:h-80 md:h-[420px] bg-cover bg-center relative"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-banner.dim_1200x500.jpg')",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-white/80 text-xs uppercase tracking-widest mb-2">
                New Collection 2026
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
                Elegance in Every Thread
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-6">
                Discover our exquisite collection of handcrafted Indian ethnic
                wear, curated for every celebration.
              </p>
              <a href="#products">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 py-5 text-base shadow-lg"
                  data-ocid="hero.primary_button"
                >
                  SHOP NOW
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <main id="products" className="flex-1 py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">
              Handpicked For You
            </p>
            <h2 className="font-sans font-bold text-3xl md:text-4xl uppercase tracking-wide text-foreground">
              We are with you
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-3" />
          </motion.div>

          {/* Product grid */}
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            data-ocid="product.list"
          >
            {PRODUCTS.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuyNow={handleBuyNow}
                index={index}
              />
            ))}
          </div>

          {/* WhatsApp CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          >
            <div className="bg-green-500 rounded-full p-3">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800">Order via WhatsApp</h3>
              <p className="text-green-700 text-sm">
                Prefer chatting? Click the WhatsApp button on any product to
                place your order instantly.
              </p>
            </div>
            <a
              href="https://wa.me/919999999999?text=Hi, I want to browse your collection"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="whatsapp.primary_button"
            >
              <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shrink-0">
                Chat on WhatsApp
              </Button>
            </a>
          </motion.div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-terracotta text-white py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-serif text-xl font-bold mb-2">
                Shri Prem Shanti Showroom
              </h3>
              <p className="text-white/70 text-sm">
                Your trusted destination for premium Indian ethnic wear since
                1995.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact Us</h4>
              <div className="space-y-1.5 text-sm text-white/80">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> +91 99999 99999
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Main Market, Local Area
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-1.5 text-sm text-white/80">
                {["Sarees", "Lehengas", "Suits", "Sherwanis"].map((l) => (
                  <p key={l}>
                    <a
                      href="#products"
                      className="hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4 text-center text-sm text-white/60">
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-white/80">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      {/* ===== CHECKOUT MODAL ===== */}
      <AnimatePresence>
        {modalOpen && (
          <CheckoutModal product={selectedProduct} onClose={handleCloseModal} />
        )}
      </AnimatePresence>
    </div>
  );
}
