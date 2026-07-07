import fs from 'fs';
let code = fs.readFileSync('src/components/ProductDetailModal.tsx', 'utf8');

const target = `              {/* Large Active Image inside Enlarged View */}
              <img
                src={getAnnotatedImageUrl(productImages[activeImageIdx])}
                alt={product.name}
                className="max-w-full max-h-[70vh] md:max-h-[82vh] object-contain select-none shadow-2xl rounded-xl"
                referrerPolicy="no-referrer"
              />`;

const replacement = `              {/* Large Active Image inside Enlarged View */}
              <motion.img
                key={activeImageIdx}
                src={getAnnotatedImageUrl(productImages[activeImageIdx])}
                alt={product.name}
                className="max-w-full max-h-[70vh] md:max-h-[82vh] object-contain select-none shadow-2xl rounded-xl cursor-grab active:cursor-grabbing touch-pan-y"
                referrerPolicy="no-referrer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -50) {
                    setActiveImageIdx((prev) => (prev + 1) % productImages.length);
                  } else if (swipe > 50) {
                    setActiveImageIdx((prev) => (prev - 1 + productImages.length) % productImages.length);
                  }
                }}
              />`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/ProductDetailModal.tsx', code);
