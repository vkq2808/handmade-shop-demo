const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");

// POST /api/cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      console.log("Invalid cart item data");
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log(`Product not found: ${productId}`);
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    if (product.stock < quantity) {
      console.log(`Insufficient stock for product ${productId}. Requested: ${quantity}, Available: ${product.stock}`);
      return res
        .status(400)
        .json({ message: `Chỉ còn ${product.stock} sản phẩm trong kho` });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          return res
            .status(400)
            .json({
              message: `Tổng số lượng vượt quá tồn kho. Hiện tại còn ${product.stock}`,
            });
        }

        existingItem.quantity = newQuantity;
      } else {
        if (quantity > product.stock) {
          return res
            .status(400)
            .json({ message: `Chỉ còn ${product.stock} sản phẩm trong kho` });
        }

        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Đã thêm vào giỏ hàng", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi thêm vào giỏ hàng", error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
    if (!cart)
      return res.status(200).json({ message: "Giỏ hàng trống", items: [] });

    // Tính tổng số lượng và tổng tiền
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + item.quantity * price;
    }, 0);

    res.status(200).json({
      cart: cart.items,
      totalItems,
      totalPrice,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy giỏ hàng", error: error.message });
  }
};

//controller
const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;
  if (!productId || quantity < 1)
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const item = cart.items.find((i) => i._id.toString() === productId);
    if (!item)
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Đã cập nhật số lượng", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật", error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    res.status(200).json({ message: "Đã xóa sản phẩm", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Đã xóa toàn bộ giỏ hàng" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa giỏ hàng", error: error.message });
  }
};

const checkout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { paymentMethod, shippingAddr } = req.body;

    // Kiểm tra giỏ hàng
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // Tìm sản phẩm cần thanh toán trong giỏ
    const cartItem = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!cartItem) {
      return res
        .status(400)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }

    // Lấy thông tin sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra tồn kho
    if (product.stock < cartItem.quantity) {
      return res.status(400).json({ message: "Không đủ hàng trong kho" });
    }

    // Tính tổng tiền
    const totalAmount = product.price * cartItem.quantity;

    // Tạo đơn hàng
    const order = new Order({
      user: userId,
      items: [
        {
          product: product._id,
          quantity: cartItem.quantity,
          price: product.price,
        },
      ],
      shippingAddr,
      paymentMethod,
      totalAmount,
    });

    await order.save();

    // Trừ hàng trong kho
    product.stock -= cartItem.quantity;
    await product.save();

    // Xoá sản phẩm khỏi giỏ hàng
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    res.status(201).json({
      message: "Đặt hàng thành công",
      order,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi thanh toán sản phẩm", error: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  clearCart,
  removeFromCart,
  checkout,
};
