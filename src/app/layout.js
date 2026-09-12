import './globals.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import WhatsAppFloat from '@/components/common/WhatsAppFloat';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { OrderProvider } from '@/context/OrderContext';
import { ProductProvider } from '@/context/ProductContext';
import { MessageProvider } from '@/context/MessageContext';
import { AuthProvider } from '@/context/AuthContext';
import { Manrope, Inter } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'KH Decotis – Style Up Your Space',
  description: 'Buy Home Decorative Items & essentials Online. Choose from a wide range of premium home decor products at KH Decotis.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${manrope.variable} ${inter.variable}`}>
        <AuthProvider>
          <MessageProvider>
            <ProductProvider>
              <OrderProvider>
                <CartProvider>
                  <WishlistProvider>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                    <WhatsAppFloat />
                  </WishlistProvider>
                </CartProvider>
              </OrderProvider>
            </ProductProvider>
          </MessageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
