নতুন চ্যানেল যোগ করতে:
1) channel_photo/03/ ফোল্ডার বানিয়ে ছবি রাখুন (number_1.jpg, number_2.jpg ...)
2) data/channels.json-এ নতুন একটি ব্লক যোগ করুন ("id": "03")
3) বিক্রি হলে "status": "sold" লিখুন, আর "sold_count" বাড়ান।
রিভিউ: ছবি review_photo/ এ রেখে data/reviews.json-এ ফাইলের নাম যোগ করুন।
চালানো: VS Code-এর Live Server দিয়ে অথবা হোস্টিং-এ আপলোড করুন (সরাসরি ফাইল খুললে JSON লোড হবে না)।
