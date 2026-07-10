import { MapLevel } from './nationalism-india'; 

export const LEVEL_1: MapLevel = {
  id: 1,
  title: 'Fundamental Theorem of Arithmetic',
  icon: '✖️',
  color: '#0ea5e9',
  notes: [
    { 
      type: 'heading', 
      content: 'The Fundamental Theorem of Arithmetic',
      hinglishContent: 'Ankganit ka Aadharbhoot Pramey (Fundamental Theorem of Arithmetic)'
    },
    { 
      type: 'paragraph', 
      content: 'Before we dive into the theorem, recall that a Prime number has exactly two factors (1 and itself, e.g., 2, 3, 5, 7), while a Composite number has more than two factors (e.g., 4, 6, 8, 9).',
      hinglishContent: 'Theorem samajhne se pehle yaad rakho ki Prime number ke sirf 2 factors hote hain (1 aur wo khud, jaise 2, 3, 5), aur Composite number ke 2 se zyada factors hote hain (jaise 4, 6, 8).'
    },
    { 
      type: 'paragraph', 
      content: 'The Fundamental Theorem of Arithmetic states: "Every composite number can be expressed (factorised) as a product of primes, and this factorisation is unique, apart from the order in which the prime factors occur."',
      hinglishContent: 'Ye theorem kehta hai: "Har composite number ko prime numbers ke multiple ke roop me toda ja sakta hai, aur ye prime factorization hamesha unique hota hai, chahe aap factors ko kisi bhi order me likho."'
    },
    { 
      type: 'highlight', 
      content: 'Detailed Example: Take 120. 120 = 2 × 60 = 2 × 2 × 30 = 2 × 2 × 2 × 15 = 2 × 2 × 2 × 3 × 5. So, 120 = 2³ × 3 × 5.',
      hinglishContent: 'Detailed Example: 120 ko dekhein. 120 = 2 × 60 = 2 × 2 × 30 = 2 × 2 × 2 × 15 = 2³ × 3 × 5. Ye iska unique prime fingerprint hai.'
    },
    { 
      type: 'bullet', 
      title: 'Numbers Ending with Zero',
      content: 'For any number to end with the digit 0, it must be divisible by 10. Therefore, its prime factorization MUST contain at least one pair of 2 and 5. For example, 6ⁿ = (2 × 3)ⁿ. Since there is no 5, 6ⁿ can NEVER end with a zero.',
      hinglishTitle: 'Zero par end hone wale numbers',
      hinglishContent: 'Agar kisi number ko 0 par end hona hai, toh uske factors me 2 aur 5 dono hone hi chahiye. Jaise 6ⁿ me (2 × 3)ⁿ hota hai, 5 nahi hai, toh ye kabhi 0 par end nahi hoga.'
    },
    {
      type: 'quote',
      content: '"Think of prime factorization as the unique DNA of a number. No two numbers share the exact same prime DNA!"',
      hinglishContent: '"Prime factorization ko numbers ka unique DNA samjho. Kisi bhi do numbers ka prime DNA same nahi ho sakta!"'
    }
  ],
  questions: [
    {
      q: 'What is the prime factorization of 140?',
      opts: ['2² × 5 × 7', '2 × 5² × 7', '2² × 3 × 7', '2 × 5 × 11'],
      ans: 0,
      explain: '140 = 2 × 70 = 2 × 2 × 35 = 2 × 2 × 5 × 7 = 2² × 5 × 7'
    },
    {
      q: 'What is the prime factorization of 156?',
      opts: ['2² × 3 × 11', '2² × 3 × 13', '2 × 3² × 13', '2 × 3 × 17'],
      ans: 1,
      explain: '156 = 2 × 78 = 2 × 2 × 39 = 2 × 2 × 3 × 13 = 2² × 3 × 13'
    },
    {
      q: 'Which of the following is a composite number?',
      opts: ['2', '17', '1', '15'],
      ans: 3,
      explain: '15 has factors 1, 3, 5, 15, so it is a composite number.'
    },
    {
      q: 'Express 3825 as a product of its prime factors.',
      opts: ['3² × 5 × 17', '3² × 5² × 17', '3 × 5² × 19', '3² × 5² × 13'],
      ans: 1,
      explain: '3825 = 3 × 1275 = 3 × 3 × 425 = 3 × 3 × 5 × 85 = 3 × 3 × 5 × 5 × 17 = 3² × 5² × 17'
    },
    {
      q: 'Is the prime factorization of a composite number unique?',
      opts: ['No', 'Yes, strictly in one order', 'Yes, except for the order of its factors', 'Only for even numbers'],
      ans: 2,
      explain: 'According to the Fundamental Theorem of Arithmetic, factorization is unique apart from the order in which the prime factors occur.'
    },
    {
      q: 'Can a number end with the digit 0 if its prime factorization does not have 5 as a factor?',
      opts: ['Yes', 'No', 'Sometimes', 'Depends on the number'],
      ans: 1,
      explain: 'To end with the digit 0, the number must be divisible by 10, meaning its prime factors must include both 2 and 5.'
    },
    {
      q: 'Can 6ⁿ end with the digit 0 for any natural number n?',
      opts: ['Yes', 'No', 'Only when n is even', 'Only when n is a multiple of 5'],
      ans: 1,
      explain: 'The prime factorization of 6 is 2 × 3. It does not contain 5, so 6ⁿ can never end in 0.'
    },
    {
      q: 'Express 5005 as a product of its prime factors.',
      opts: ['5 × 7 × 11 × 13', '5 × 11 × 13 × 17', '5 × 7 × 13 × 19', '5 × 7 × 11 × 17'],
      ans: 0,
      explain: '5005 = 5 × 1001 = 5 × 7 × 143 = 5 × 7 × 11 × 13'
    },
    {
      q: 'Express 7429 as a product of primes.',
      opts: ['13 × 17 × 19', '17 × 19 × 23', '19 × 23 × 29', '17 × 23 × 29'],
      ans: 1,
      explain: '7429 is divisible by 17 (7429/17 = 437). 437 is divisible by 19 (437/19 = 23). So, 17 × 19 × 23.'
    },
    {
      q: 'Why is (7 × 11 × 13) + 13 a composite number?',
      opts: ['Because it is an even number', 'Because it ends in 0', 'Because it can be factored as 13 × (77 + 1)', 'Because it is a prime number'],
      ans: 2,
      explain: '(7 × 11 × 13) + 13 = 13(7 × 11 + 1) = 13 × 78. Since it has factors other than 1 and itself, it is composite.'
    },
    {
      q: 'The Fundamental Theorem of Arithmetic is applicable to which of the following?',
      opts: ['Only Prime Numbers', 'Only Composite Numbers', 'Both Prime and Composite Numbers', 'Irrational Numbers'],
      ans: 1,
      explain: 'The theorem states that every composite number can be uniquely expressed as a product of primes.'
    },
    {
      q: 'What is the smallest composite number?',
      opts: ['1', '2', '3', '4'],
      ans: 3,
      explain: '4 is the smallest number that has more than two factors (1, 2, 4).'
    },
    {
      q: 'What is the smallest prime number?',
      opts: ['0', '1', '2', '3'],
      ans: 2,
      explain: '2 is the smallest prime number and the only even prime number.'
    },
    {
      q: 'What is the product of the smallest prime number and the smallest composite number?',
      opts: ['4', '6', '8', '10'],
      ans: 2,
      explain: 'Smallest prime = 2, Smallest composite = 4. Product = 2 × 4 = 8.'
    },
    {
      q: 'What is the prime factorization of 210?',
      opts: ['2 × 3 × 5 × 7', '2² × 5 × 7', '3 × 5 × 11', '2 × 5 × 7 × 11'],
      ans: 0,
      explain: '210 = 2 × 105 = 2 × 3 × 35 = 2 × 3 × 5 × 7'
    }
  ]
};

export const LEVEL_2: MapLevel = {
  id: 2,
  title: 'HCF and LCM Properties',
  icon: '➗',
  color: '#3b82f6',
  notes: [
    { 
      type: 'heading', 
      content: 'Finding HCF and LCM Depth Guide',
      hinglishContent: 'HCF aur LCM Nikalne ka Detailed Guide'
    },
    { 
      type: 'paragraph', 
      content: 'Using prime factorization is the most robust way to find the Highest Common Factor (HCF) and Least Common Multiple (LCM). Let us look at how it actually works step-by-step.',
      hinglishContent: 'Prime factorization method HCF aur LCM nikalne ka sabse best tareeqa hai. Aao dekhte hain ye step-by-step kaise kaam karta hai.'
    },
    { 
      type: 'bullet', 
      title: 'HCF (Highest Common Factor)', 
      content: 'Rule: The product of the SMALLEST power of each COMMON prime factor in the numbers. For example, if A = 2³ × 3² and B = 2² × 3³ × 5. The common primes are 2 and 3. The smallest power of 2 is 2², and of 3 is 3². So, HCF = 2² × 3² = 36.',
      hinglishTitle: 'HCF (Highest Common Factor)',
      hinglishContent: 'Rule: Dono numbers me jo COMMON prime factors hain, unki SABSE CHHOTI (smallest) power ko multiply karo. Jaise A = 2³ × 3² aur B = 2² × 3³ × 5. Common 2 aur 3 hain. Chhoti powers 2² aur 3² hain. HCF = 2² × 3² = 36.'
    },
    { 
      type: 'bullet', 
      title: 'LCM (Least Common Multiple)', 
      content: 'Rule: The product of the GREATEST power of EVERY prime factor involved in the numbers. Using A and B above, we look at all primes: 2, 3, and 5. Greatest powers are 2³, 3³, and 5¹. So, LCM = 2³ × 3³ × 5¹ = 1080.',
      hinglishTitle: 'LCM (Least Common Multiple)',
      hinglishContent: 'Rule: Numbers me aane wale HAR EK prime factor ki SABSE BADI (greatest) power ko multiply karo, chahe wo common ho ya nahi. A aur B me sabhi primes 2, 3, 5 hain. Badi powers 2³, 3³, aur 5¹ hain. LCM = 2³ × 3³ × 5¹ = 1080.'
    },
    { 
      type: 'highlight', 
      content: 'Crucial Property: HCF(a, b) × LCM(a, b) = a × b. WARNING: This formula is valid ONLY for TWO positive integers. It fails for 3 or more numbers.',
      hinglishContent: 'Crucial Property: HCF(a, b) × LCM(a, b) = a × b. WARNING: Ye formula sirf do (two) numbers ke liye sahi hai. 3 numbers me mat lagana!'
    }
  ],
  questions: [
    {
      q: 'Find the HCF of 26 and 91.',
      opts: ['7', '13', '26', '91'],
      ans: 1,
      explain: '26 = 2 × 13. 91 = 7 × 13. The highest common factor is 13.'
    },
    {
      q: 'Find the LCM of 26 and 91.',
      opts: ['13', '182', '2366', '91'],
      ans: 1,
      explain: '26 = 2 × 13. 91 = 7 × 13. LCM = 2 × 7 × 13 = 182.'
    },
    {
      q: 'What is the HCF of 510 and 92?',
      opts: ['2', '4', '23', '510'],
      ans: 0,
      explain: '510 = 2 × 3 × 5 × 17. 92 = 2² × 23. Common prime factor is 2 with smallest power 1, so HCF is 2.'
    },
    {
      q: 'What is the LCM of 510 and 92?',
      opts: ['46920', '23460', '182', '2'],
      ans: 1,
      explain: 'LCM = 2² × 3 × 5 × 17 × 23 = 23460.'
    },
    {
      q: 'Find the HCF of 12, 15 and 21.',
      opts: ['1', '2', '3', '4'],
      ans: 2,
      explain: '12=2²×3, 15=3×5, 21=3×7. The only common factor is 3.'
    },
    {
      q: 'Find the LCM of 12, 15 and 21.',
      opts: ['420', '840', '180', '60'],
      ans: 0,
      explain: 'LCM = 2² × 3 × 5 × 7 = 420.'
    },
    {
      q: 'What is the HCF of 8, 9, and 25?',
      opts: ['2', '3', '5', '1'],
      ans: 3,
      explain: '8=2³, 9=3², 25=5². There are no common prime factors, so the HCF is 1.'
    },
    {
      q: 'What is the LCM of 8, 9, and 25?',
      opts: ['1', '72', '225', '1800'],
      ans: 3,
      explain: 'LCM = 2³ × 3² × 5² = 8 × 9 × 25 = 1800.'
    },
    {
      q: 'Given HCF(306, 657) = 9, find LCM(306, 657).',
      opts: ['22338', '306', '657', '22383'],
      ans: 0,
      explain: 'LCM = (a × b) / HCF = (306 × 657) / 9 = 34 × 657 = 22338.'
    },
    {
      q: 'Sonia takes 18 mins to drive one round of a field. Ravi takes 12 mins. After how many minutes will they meet at the starting point?',
      opts: ['36 mins', '24 mins', '6 mins', '72 mins'],
      ans: 0,
      explain: 'We need to find the LCM of 18 and 12. 18=2×3², 12=2²×3. LCM = 2² × 3² = 4 × 9 = 36 mins.'
    },
    {
      q: 'If two positive integers p and q can be expressed as p = ab² and q = a³b (where a,b are prime numbers), what is the LCM of p and q?',
      opts: ['ab', 'a²b²', 'a³b²', 'a³b³'],
      ans: 2,
      explain: 'LCM takes the highest powers of all prime factors. Highest power of a is a³, highest of b is b². So, LCM is a³b².'
    },
    {
      q: 'Using the same values (p = ab² and q = a³b), what is the HCF of p and q?',
      opts: ['ab', 'a²b²', 'a³b²', 'a³b³'],
      ans: 0,
      explain: 'HCF takes the lowest powers of common prime factors. Lowest power of a is a, lowest of b is b. So, HCF is ab.'
    },
    {
      q: 'If the product of two numbers is 3200 and their LCM is 320, find their HCF.',
      opts: ['10', '100', '32', '320'],
      ans: 0,
      explain: 'HCF × LCM = Product. HCF × 320 = 3200 => HCF = 3200 / 320 = 10.'
    },
    {
      q: 'The HCF of two numbers is 27 and their LCM is 162. If one number is 54, find the other.',
      opts: ['36', '45', '81', '90'],
      ans: 2,
      explain: 'HCF × LCM = a × b => 27 × 162 = 54 × b => b = (27 × 162) / 54 = 81.'
    },
    {
      q: 'Can two numbers have 15 as their HCF and 175 as their LCM?',
      opts: ['Yes', 'No', 'Only if numbers are odd', 'Cannot be determined'],
      ans: 1,
      explain: 'The HCF must always be a factor of the LCM. 175 is not exactly divisible by 15 (175/15 = 11.66), so it is not possible.'
    }
  ]
};

export const LEVEL_3: MapLevel = {
  id: 3,
  title: 'Irrational Numbers',
  icon: 'π',
  color: '#8b5cf6',
  notes: [
    { 
      type: 'heading', 
      content: 'Proving Irrationality Step-by-Step',
      hinglishContent: 'Irrationality Prove Karne ka Tarika'
    },
    { 
      type: 'paragraph', 
      content: 'A rational number can be expressed as p/q (where p,q are integers and q≠0). An irrational number cannot. To prove a number like √2 is irrational, we use a powerful method called "Proof by Contradiction".',
      hinglishContent: 'Rational number ko hum p/q me likh sakte hain, irrational ko nahi. √2 jaise numbers ko irrational prove karne ke liye hum "Proof by Contradiction" (ulta maan kar chalna) method use karte hain.'
    },
    { 
      type: 'bullet', 
      title: 'Crucial Theorem', 
      content: 'Let p be a prime number. If p divides a², then p must also divide a (where a is a positive integer). This is the backbone of our proof.',
      hinglishTitle: 'Sabse Important Theorem',
      hinglishContent: 'Maan lo p ek prime number hai. Agar p kisi number ke square (a²) ko divide karta hai, toh wo pakka us number (a) ko bhi divide karega. Ye rule proof ki jaan hai!'
    },
    { 
      type: 'bullet', 
      title: 'Detailed Proof for √2', 
      content: 'Step 1: Assume √2 is rational. So, √2 = a/b (where a and b are co-prime, meaning they share no common factor other than 1).\nStep 2: Squaring both sides gives 2 = a²/b², which means a² = 2b².\nStep 3: This implies 2 divides a². By our theorem, 2 must also divide a. So we can write a = 2c.\nStep 4: Substitute a = 2c back into a² = 2b². We get (2c)² = 2b² ➔ 4c² = 2b² ➔ b² = 2c².\nStep 5: This implies 2 divides b², meaning 2 divides b.\nConclusion: Both a and b are divisible by 2! But we assumed they were co-prime. This contradiction means our assumption was WRONG. Therefore, √2 is irrational.',
      hinglishTitle: '√2 ka Detailed Proof',
      hinglishContent: 'Step 1: Ulta maano ki √2 rational hai, yani √2 = a/b (jahan a aur b co-prime hain, unme 1 ke alawa kuch common nahi hai).\nStep 2: Dono taraf square karo: 2 = a²/b², jisse mila a² = 2b².\nStep 3: Iska matlab a² ko 2 divide karta hai. Theorem ke hisaab se a ko bhi 2 divide karega. Toh hum likh sakte hain a = 2c.\nStep 4: a = 2c ko purani equation me dalo: (2c)² = 2b² ➔ 4c² = 2b² ➔ b² = 2c².\nStep 5: Ab dikh raha hai ki b² ko bhi 2 divide karta hai, matlab b ko bhi 2 divide karega.\nConclusion: a aur b dono me 2 common nikal gaya! Par humne toh inhe co-prime mana tha. Hamara assumption galat tha, isliye √2 irrational hai.'
    },
    { 
      type: 'highlight', 
      content: 'Important Arithmetic Rules: The sum, difference, product, or quotient of a NON-ZERO rational and an irrational number is ALWAYS IRRATIONAL.',
      hinglishContent: 'Zaroori Rules: Ek rational (non-zero) aur ek irrational number ko add, subtract, multiply, ya divide karoge, toh answer hamesha IRRATIONAL hi aayega.'
    }
  ],
  questions: [
    {
      q: 'Which of the following is an irrational number?',
      opts: ['√4', '√9', '√2', '√16'],
      ans: 2,
      explain: '√4 = 2, √9 = 3, √16 = 4 are all rational. √2 cannot be expressed as a simple fraction.'
    },
    {
      q: 'If p is a prime number and p divides a², then which of the following is true?',
      opts: ['p divides 2a', 'p divides a', 'p divides a/2', 'p does not divide a'],
      ans: 1,
      explain: 'By the Fundamental Theorem of Arithmetic, if a prime p divides the square of a number, it must divide the number itself.'
    },
    {
      q: 'The sum of a rational and an irrational number is always:',
      opts: ['Rational', 'Irrational', 'Can be both', 'Depends on the numbers'],
      ans: 1,
      explain: 'Adding a rational to an irrational always results in an irrational number.'
    },
    {
      q: 'The product of a non-zero rational and an irrational number is always:',
      opts: ['Rational', 'Irrational', 'Can be both', 'Zero'],
      ans: 1,
      explain: 'Multiplying a non-zero rational with an irrational always yields an irrational number.'
    },
    {
      q: 'When proving √3 is irrational, what is the initial assumption made in Proof by Contradiction?',
      opts: ['√3 is an integer', '√3 is irrational', '√3 is rational', '√3 is a prime number'],
      ans: 2,
      explain: 'We start by assuming the opposite of what we want to prove, i.e., that √3 can be written as p/q.'
    },
    {
      q: 'Is (3 + √5) - √5 rational or irrational?',
      opts: ['Rational', 'Irrational', 'Both', 'Neither'],
      ans: 0,
      explain: '(3 + √5) - √5 = 3, which is a rational number.'
    },
    {
      q: 'Is 2√5 rational or irrational?',
      opts: ['Rational', 'Irrational', 'Fraction', 'Integer'],
      ans: 1,
      explain: 'It is the product of a non-zero rational (2) and an irrational (√5), so it is irrational.'
    },
    {
      q: 'Is 1/√2 rational or irrational?',
      opts: ['Rational', 'Irrational', 'Both', 'None of the above'],
      ans: 1,
      explain: 'Dividing a non-zero rational (1) by an irrational (√2) gives an irrational number.'
    },
    {
      q: 'Which of the following is a rational number?',
      opts: ['√2', '√3', '√5', '√9'],
      ans: 3,
      explain: '√9 simplifies to 3, which is a rational number.'
    },
    {
      q: 'π (Pi) is an example of what type of number?',
      opts: ['Rational', 'Irrational', 'Integer', 'Whole Number'],
      ans: 1,
      explain: 'π has a non-terminating, non-repeating decimal expansion, making it an irrational number.'
    },
    {
      q: '22/7 is an example of what type of number?',
      opts: ['Rational', 'Irrational', 'Integer', 'Whole Number'],
      ans: 0,
      explain: '22/7 is a fraction in the form p/q where p and q are integers, so it is a rational number. (It is just an approximation of π, not exactly π).'
    },
    {
      q: 'In the proof that √2 is irrational, we assume √2 = a/b where a and b are:',
      opts: ['Even numbers', 'Prime numbers', 'Co-prime integers', 'Irrational numbers'],
      ans: 2,
      explain: 'We assume a and b are co-prime, meaning their only common factor is 1. The proof shows they share a factor of 2, creating a contradiction.'
    },
    {
      q: 'Is 5 - √3 rational or irrational?',
      opts: ['Rational', 'Irrational', 'Integer', 'Natural Number'],
      ans: 1,
      explain: 'The difference between a rational and an irrational number is irrational.'
    },
    {
      q: 'If a is a rational number (a ≠ 0) and b is an irrational number, then a/b is:',
      opts: ['Rational', 'Irrational', 'Sometimes rational', 'Zero'],
      ans: 1,
      explain: 'The quotient of a non-zero rational and an irrational is always irrational.'
    },
    {
      q: 'Is √2 + √3 rational or irrational?',
      opts: ['Rational', 'Irrational', 'Depends', 'Integer'],
      ans: 1,
      explain: 'The sum of two distinct square roots of primes is irrational.'
    }
  ]
};

export const LEVEL_4: MapLevel = {
  id: 4,
  title: 'BOSS: The Chapter Test',
  icon: '💀',
  color: '#dc2626',
  notes: [
    { 
      type: 'heading', 
      content: 'Final Boss: Master of Real Numbers',
      hinglishContent: 'Aakhri Boss: Real Numbers ka Master'
    },
    { 
      type: 'sketch', 
      sketchType: 'demon', 
      content: 'A towering mathematical demon.' 
    },
    { 
      type: 'paragraph', 
      content: 'This is the final test of your knowledge on Real Numbers. It will test you comprehensively on prime factorizations, HCF, LCM word problems, and irrationality logic. Ensure you have pen and paper ready. Defeat this boss to claim your victory and master the chapter!',
      hinglishContent: 'Ye tumhara final test hai! Isme Prime factorization, HCF/LCM ke word problems, aur irrationality sab kuch mix aayega. Pen aur copy taiyar rakh lo. Is boss ko harao aur is chapter ke master ban jao!'
    }
  ],
  questions: [
    {
      q: 'What is the exponent of 2 in the prime factorization of 144?',
      opts: ['3', '4', '5', '6'],
      ans: 1,
      explain: '144 = 16 × 9 = 2⁴ × 3². The exponent of 2 is 4.'
    },
    {
      q: 'Find the LCM of the smallest two-digit composite number and the smallest composite number.',
      opts: ['10', '20', '30', '40'],
      ans: 1,
      explain: 'Smallest two-digit composite = 10. Smallest composite = 4. LCM of 10 and 4 is 20.'
    },
    {
      q: 'What is the HCF of two consecutive even numbers?',
      opts: ['1', '2', '3', '4'],
      ans: 1,
      explain: 'Two consecutive even numbers (e.g. 4 and 6, or 10 and 12) will always have a highest common factor of 2.'
    },
    {
      q: 'What is the HCF of two co-prime numbers?',
      opts: ['0', '1', 'The product of the numbers', 'Depends on the numbers'],
      ans: 1,
      explain: 'Co-prime numbers have no common factor other than 1.'
    },
    {
      q: 'If n is a natural number, then 9ⁿ - 4ⁿ is always divisible by:',
      opts: ['5', '13', 'Both 5 and 13', 'None'],
      ans: 0,
      explain: 'aⁿ - bⁿ is always divisible by (a - b). So, 9ⁿ - 4ⁿ is divisible by 9 - 4 = 5.'
    },
    {
      q: 'For some integer q, every odd integer is of the form:',
      opts: ['q', 'q + 1', '2q', '2q + 1'],
      ans: 3,
      explain: 'Even numbers are 2q. Odd numbers are one more than an even number, so 2q + 1.'
    },
    {
      q: 'For some integer m, every even integer is of the form:',
      opts: ['m', 'm + 1', '2m', '2m + 1'],
      ans: 2,
      explain: 'An even number is always divisible by 2, hence it can be written as 2m.'
    },
    {
      q: 'The largest number which divides 70 and 125, leaving remainders 5 and 8 respectively, is:',
      opts: ['13', '65', '875', '1750'],
      ans: 0,
      explain: 'The number must divide (70 - 5) = 65 and (125 - 8) = 117 perfectly. HCF of 65 and 117 is 13.'
    },
    {
      q: 'If two numbers are in the ratio 2:3 and their LCM is 180, what is the smaller number?',
      opts: ['30', '40', '60', '90'],
      ans: 2,
      explain: 'Let numbers be 2x and 3x. LCM is 6x. 6x = 180 => x = 30. Smaller number = 2(30) = 60.'
    },
    {
      q: 'Two numbers are in the ratio 3:4 and their HCF is 4. What is their LCM?',
      opts: ['12', '16', '24', '48'],
      ans: 3,
      explain: 'The numbers are 3(4) = 12 and 4(4) = 16. LCM of 12 and 16 is 48.'
    },
    {
      q: 'The HCF of 96 and 404 is:',
      opts: ['4', '12', '96', '9696'],
      ans: 0,
      explain: '96 = 2⁵ × 3. 404 = 2² × 101. HCF = 2² = 4.'
    },
    {
      q: 'Which of the following is NOT an irrational number?',
      opts: ['2 - √3', '√2 + √3', '√12 / √3', '√7'],
      ans: 2,
      explain: '√12 / √3 = √(12/3) = √4 = 2, which is rational.'
    },
    {
      q: 'If a and b are co-prime, then a² and b² are:',
      opts: ['Co-prime', 'Not co-prime', 'Even', 'Odd'],
      ans: 0,
      explain: 'If a and b share no common prime factors, squaring them will not introduce any new prime factors. Thus, a² and b² remain co-prime.'
    },
    {
      q: 'What is the HCF of 1 and any other positive integer?',
      opts: ['0', '1', 'The integer itself', 'Cannot be determined'],
      ans: 1,
      explain: 'The only factor of 1 is 1, so the highest common factor with any number is 1.'
    },
    {
      q: 'The product of two consecutive positive integers is always divisible by:',
      opts: ['2', '3', '4', '5'],
      ans: 0,
      explain: 'One of any two consecutive positive integers is always even, so their product is divisible by 2.'
    }
  ]
};

export const ALL_LEVELS: MapLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];
