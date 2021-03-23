import { AxiosResponse } from "axios";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    let cartParsed = [];
    if (storagedCart) {
      cartParsed = JSON.parse(storagedCart);
    }

    return cartParsed;
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: product }: AxiosResponse<Product> = await api.get(
        `products/${productId}`
      );
      if (!product) {
        toast.error("Erro na adição do produto");
        return;
      }
      const { data: stock }: AxiosResponse<Stock> = await api.get(
        `/stock/${productId}`
      );

      const productInCart = cart.find((item) => item.id === productId);
      const cartFiltered = cart.filter((item) => item.id !== productId);

      if (productInCart) {
        if (productInCart.amount + 1 > stock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        const newProduct: Product = {
          ...productInCart,
          amount: productInCart.amount + 1,
        };

        const cartUpdated = [...cartFiltered, newProduct];

        console.log("Chamou o local storage 1");
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));

        setCart(cartUpdated);
        return;
      }

      const cartUpdated: Product[] = [
        ...cartFiltered,
        { ...product, amount: 1 },
      ];

      if (stock.amount < 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      console.log("Chamou o local storage 2");

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));

      setCart(cartUpdated);
    } catch {
      toast.error("Erro na adição do produto");
      toast.error("Quantidade solicitada fora de estoque");
      return;
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const products = cart.filter((item) => item.id !== productId);

      const product = cart.find((item) => item.id === productId);

      if (!product) {
        toast.error("Erro na remoção do produto");
        return;
      }

      setCart(products);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));
    } catch {
      toast.error("Erro na remoção do produto");
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock }: AxiosResponse<Stock> = await api.get(
        `/stock/${productId}`
      );

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (amount < 1) return;

      const cartFiltered = cart.filter((item) => item.id !== productId);
      const product = cart.find((item) => item.id === productId);
      if (!product) return;

      const cartUpdated = [...cartFiltered, { ...product, amount }];

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));

      setCart(cartUpdated);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
