import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjM4ODQsImV4cCI6MjA4NDk5OTg4NH0.7HeGWdSNN2UbYkpCbxawc_pWcjTJ3jQpNC1qCRb4C8o';

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

// ─────────────────────────────────────────────
//  QUESTIONS ARRAY
// ─────────────────────────────────────────────
const questions = [
  // ── MATHS: Real Numbers (Questions 1 - 100) ────────────────────────
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If two positive integers A and B can be expressed as A = xy^3 and B = x^4y^2z, where x, y, z are prime numbers, what is the LCM of A and B?',
    options: ['x^4 y^3 z', 'x y^2', 'x^4 y^3', 'x y^2 z'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The largest number which divides 285 and 1249 leaving remainders 9 and 7 respectively is:',
    options: ['138', '276', '124', '142'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If n is an odd integer, then n^2 - 1 is always divisible by:',
    options: ['6', '8', '10', '12'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The least number that is divisible by all the natural numbers from 1 to 10 (both inclusive) is:',
    options: ['100', '1260', '2520', '5040'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The decimal expansion of the rational number 14587 / 1250 will terminate after how many decimal places?',
    options: ['2', '3', '4', '5'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the HCF of 65 and 117 is expressible in the form 65m - 117, then the value of m is:',
    options: ['4', '2', '1', '3'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Given that HCF(2520, 6600) = 40 and LCM(2520, 6600) = 252 * k, what is the value of k?',
    options: ['1650', '16500', '165', '16.5'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If p and q are two distinct prime numbers, what is their HCF and LCM respectively?',
    options: ['1 and p+q', 'p and q', '1 and pq', 'p and pq'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following rational numbers has a non-terminating repeating decimal expansion?',
    options: ['31 / 3125', '17 / 512', '23 / 200', '64 / 455'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If HCF(a, b) = 12 and a * b = 1800, then the LCM(a, b) is:',
    options: ['3600', '900', '150', '1800'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Two alarm clocks ring their alarms at regular intervals of 50 seconds and 48 seconds. If they first beep together at 12 noon, at what time will they beep again for the first time?',
    options: ['12:20 PM', '12:12 PM', '12:11 PM', '12:10 PM'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If x and y are odd positive integers, then x^2 + y^2 is:',
    options: ['Even and divisible by 4', 'Even and not divisible by 4', 'Odd and divisible by 3', 'Odd and not divisible by 3'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'How many prime factors are there in the prime factorization of 1001?',
    options: ['2', '3', '4', '5'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The sum of the exponents of the prime factors in the prime factorization of 196 is:',
    options: ['3', '4', '5', '2'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'A rectangular courtyard is 18m 72cm long and 13m 20cm broad. It is to be paved with square tiles of the same size. Find the least possible number of such tiles.',
    options: ['4290', '429', '8580', '858'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If a = 2^3 * 3, b = 2 * 3 * 5, and c = 3^n * 5, and LCM(a,b,c) = 2^3 * 3^2 * 5, then n is:',
    options: ['1', '2', '3', '4'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the greatest number of 6 digits exactly divisible by 24, 15 and 36?',
    options: ['999999', '999720', '999724', '999920'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the HCF of two numbers is 1, then the two numbers are called:',
    options: ['Composite numbers', 'Twin primes', 'Co-primes', 'Perfect numbers'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The product of a non-zero rational and an irrational number is:',
    options: ['Always irrational', 'Always rational', 'Rational or irrational', 'One'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If p is a prime number and p divides a^2, then p also divides a, where a is a:',
    options: ['Negative integer', 'Positive integer', 'Rational number', 'Real number'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the smallest number which when increased by 17 is exactly divisible by both 520 and 468.',
    options: ['4680', '4663', '4697', '5200'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The difference of two irrational numbers is:',
    options: ['Always irrational', 'Always rational', 'May be rational or irrational', 'Zero'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following is true for any two positive integers a and b?',
    options: ['HCF(a,b) > LCM(a,b)', 'HCF(a,b) = LCM(a,b)', 'LCM(a,b) is a multiple of HCF(a,b)', 'HCF(a,b) is a multiple of LCM(a,b)'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If n is a natural number, then 6^n - 5^n always ends with the digit:',
    options: ['1', '3', '5', '7'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the HCF of the smallest composite number and the smallest prime number?',
    options: ['1', '2', '3', '4'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The ratio of the LCM and HCF of the least composite and the least prime numbers is:',
    options: ['1:2', '2:1', '1:1', '1:3'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Three bells toll at intervals of 9, 12, and 15 minutes. If they start tolling together, after what time will they next toll together?',
    options: ['3 hours', '180 hours', '360 minutes', '36 minutes'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If two positive integers p and q are expressible as p = a^2 b^3 and q = a^3 b, where a and b are prime numbers, then LCM(p, q) is:',
    options: ['a^2 b', 'a^3 b^3', 'a^5 b^4', 'a b'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the prime factorization of a natural number N is 2^3 * 3^2 * 5^2 * 7, write the number of consecutive zeros in N.',
    options: ['1', '2', '3', '4'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'A rational number can be expressed as a terminating decimal if the prime factors of its denominator are only:',
    options: ['2 or 5', '2 or 3', '3 or 5', '2, 3 or 5'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'For what value of natural number n, 4^n can end with the digit 0?',
    options: ['1', '2', 'No value of n', 'Infinity'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The decimal expansion of pi (π) is:',
    options: ['Terminating', 'Non-terminating and recurring', 'Non-terminating and non-recurring', 'Rational'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If x = p/q is a rational number, such that the prime factorization of q is of the form 2^m * 5^n, where m and n are non-negative integers. Then x has a decimal expansion which:',
    options: ['Terminates', 'Is non-terminating repeating', 'Is non-terminating non-repeating', 'Is an integer'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following numbers is an irrational number?',
    options: ['sqrt(16) / sqrt(25)', 'sqrt(12) / sqrt(3)', 'sqrt(9) * sqrt(4)', 'sqrt(2) * sqrt(8) + sqrt(3)'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If p, q are two consecutive natural numbers, then HCF(p, q) is:',
    options: ['p', 'q', 'pq', '1'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Two numbers are in the ratio of 15:11. If their HCF is 13, find the larger number.',
    options: ['143', '195', '165', '130'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the greatest number that will divide 445, 572 and 699 leaving remainders 4, 5 and 6 respectively.',
    options: ['63', '53', '43', '73'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The product of two numbers is 3200 and the quotient when the larger number is divided by the smaller is 2. The numbers are:',
    options: ['80, 40', '160, 20', '64, 50', '32, 100'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'LCM of two co-prime numbers is always equal to:',
    options: ['Their sum', 'Their difference', 'Their product', '1'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the sum of HCF and LCM of 15, 20, and 25?',
    options: ['300', '305', '150', '155'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the HCF of 408 and 1032 is expressible in the form 1032 * 2 + 408 * p, then the value of p is:',
    options: ['5', '-5', '4', '-4'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Let a and b be two positive integers such that a = p^3 q^4 and b = p^2 q^3, where p and q are prime numbers. If HCF(a,b) = p^m q^n and LCM(a,b) = p^r q^s, then (m+n)(r+s) =',
    options: ['15', '30', '35', '72'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If 3 is the least prime factor of number a and 7 is the least prime factor of number b, then the least prime factor of (a + b) is:',
    options: ['2', '3', '5', '10'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'How many rational numbers exist between any two distinct rational numbers?',
    options: ['None', 'One', 'Ten', 'Infinite'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The sum of a rational and an irrational number is:',
    options: ['Always rational', 'Always irrational', 'Sometimes rational', 'Zero'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the least number which when divided by 15, 20, 25 and 30 leaves a remainder of 8 in each case.',
    options: ['300', '308', '292', '320'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the LCM of a and 18 is 36 and the HCF of a and 18 is 2, then a is:',
    options: ['2', '3', '4', '1'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The decimal representation of 71 / 150 is:',
    options: ['Terminating', 'Non-terminating repeating', 'Non-terminating non-repeating', 'None of these'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If two numbers are in the ratio 2:3 and their LCM is 180, what is the HCF?',
    options: ['10', '15', '20', '30'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The product of three consecutive positive integers is always divisible by:',
    options: ['4', '5', '6', '8'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If a, b are positive integers and a = bq + r (Euclid\'s lemma concept), then r must satisfy:',
    options: ['1 < r < b', '0 < r <= b', '0 <= r < b', '0 < r < b'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following is an odd integer if n is an integer?',
    options: ['2n', '2n + 1', 'n^2', 'n(n+1)'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the greatest number of 4 digits exactly divisible by 12, 15, 20 and 35.',
    options: ['9999', '9980', '9660', '9860'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: '1.23484848... is a/an:',
    options: ['Integer', 'Rational number', 'Irrational number', 'Whole number'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the unit digit of (13^2003)?',
    options: ['1', '3', '7', '9'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'A number when divided by 61 gives 27 as quotient and 32 as remainder. The number is:',
    options: ['1639', '1679', '1749', '1569'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Any positive odd integer is of the form 4q + 1 or 4q + 3, where q is:',
    options: ['A prime number', 'A whole number', 'An integer', 'A rational number'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If x is a rational number and y is an irrational number, then x - y is:',
    options: ['Always rational', 'Always irrational', 'Zero', 'Can be either'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the HCF of 210 and 55 is expressible in the form 210 * 5 + 55y, find y.',
    options: ['-19', '19', '20', '-20'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The largest number which divides 60 and 75 leaving remainders 8 and 10 respectively is:',
    options: ['13', '65', '26', '52'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Given that a and b are two consecutive even numbers, what is their HCF?',
    options: ['1', '2', '4', 'ab'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following is not an irrational number?',
    options: ['sqrt(2) + sqrt(3)', 'sqrt(2) * sqrt(3)', 'sqrt(2) / sqrt(3)', '(2 + sqrt(3))(2 - sqrt(3))'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The least number which is a perfect square and is divisible by each of 16, 20 and 24 is:',
    options: ['240', '1600', '2400', '3600'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The HCF of two consecutive odd numbers is:',
    options: ['0', '1', '2', 'Their product'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If a number N = 2^3 * 3^1 * 5^4 * 7^2, then the number of factors of N is:',
    options: ['10', '24', '120', '210'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Two numbers are in the ratio 3:4 and their HCF is 4. Their LCM is:',
    options: ['12', '16', '24', '48'],
    correctOption: 3,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which among the following is the HCF of 1.08, 0.36 and 0.9?',
    options: ['0.03', '0.18', '0.9', '1.08'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'An army contingent of 616 members is to march behind an army band of 32 members in a parade. The maximum number of columns is:',
    options: ['8', '16', '32', '64'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the LCM of two numbers is 1200, which of the following cannot be their HCF?',
    options: ['600', '500', '400', '200'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'When a number is divided by 899, the remainder is 63. If the same number is divided by 29, the remainder will be:',
    options: ['10', '5', '4', '2'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The HCF of 96 and 404 is:',
    options: ['2', '4', '6', '8'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'LCM of 96 and 404 is:',
    options: ['9696', '9604', '4040', '4096'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Express 156 as a product of its prime factors.',
    options: ['2 * 3 * 13', '2^2 * 3 * 13', '2^2 * 3^2 * 13', '2 * 3^2 * 13'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the sum of the digits of the LCM of 12, 15 and 21?',
    options: ['6', '7', '8', '9'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If LCM(x, 18) = 36 and HCF(x, 18) = 2, find x.',
    options: ['2', '4', '6', '8'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The simplest form of 1095 / 1168 is:',
    options: ['13/16', '15/16', '17/16', '25/26'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: '7 * 11 * 13 + 13 is a:',
    options: ['Prime number', 'Composite number', 'Odd number', 'Irrational number'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If p is a prime number, then what is the LCM of p, p^2, p^3?',
    options: ['p', 'p^2', 'p^3', 'p^6'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The decimal expansion of the rational number 43 / (2^4 * 5^3) will terminate after:',
    options: ['3 places', '4 places', '5 places', '1 place'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the largest number that divides 2053 and 967 and leaves a remainder of 5 and 7 respectively.',
    options: ['64', '32', '128', '256'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If n is any natural number, then 5^n cannot end with the digit:',
    options: ['0', '5', 'Both 0 and any other digit except 5', 'None of these'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The values of x and y in the prime factorization tree: N -> 2, x; x -> 3, y; y -> 5, 7 are:',
    options: ['x=105, y=35', 'x=35, y=105', 'x=105, y=7', 'x=70, y=35'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If a number ends with 0, its prime factorization must contain at least one pair of:',
    options: ['2 and 3', '3 and 5', '2 and 5', '5 and 7'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the HCF of two co-prime numbers?',
    options: ['0', '1', 'Product of the numbers', 'Difference of the numbers'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If a positive integer a is divided by 3, what are the possible remainders?',
    options: ['0, 1', '0, 1, 2', '1, 2, 3', '0, 1, 2, 3'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The square of an odd positive integer is of the form:',
    options: ['8q', '8q + 1', '8q + 2', '8q + 3'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following is not a property of the HCF of two numbers a and b?',
    options: ['It divides both a and b', 'It is less than or equal to the minimum of a and b', 'It is a multiple of their LCM', 'It divides their LCM'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The product of two consecutive positive integers is divisible by 2. This statement is:',
    options: ['True', 'False', 'Only true for even numbers', 'Only true for odd numbers'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If the prime factors of the denominator of a fraction in its simplest form are 2 and 5 only, then the fraction has a:',
    options: ['Non-terminating repeating decimal', 'Terminating decimal', 'Non-terminating non-repeating decimal', 'None of these'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If two positive integers a and b are expressible as a = p*q^2 and b = p^3*q, where p and q are prime numbers, then LCM(a,b) is:',
    options: ['p q', 'p^3 q^2', 'p^3 q^3', 'p^2 q^2'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Which of the following is an irrational number?',
    options: ['0.1011011101111...', '2.345345345...', '5', 'sqrt(16)'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'To show that sqrt(2) is irrational, we usually assume the contrary. What type of proof is this?',
    options: ['Direct proof', 'Proof by induction', 'Proof by contradiction', 'Proof by exhaustion'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If a = bq + r, and we want to find HCF(a,b), then HCF(a,b) is equal to:',
    options: ['HCF(b, r)', 'HCF(a, r)', 'HCF(q, r)', 'HCF(a, q)'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'The number of zeroes at the end of the number 2^4 * 3^2 * 5^3 * 7 is:',
    options: ['2', '3', '4', '0'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'If p is a prime, the sum of its factors is:',
    options: ['p', 'p - 1', 'p + 1', '2p'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the minimum number of books needed to distribute equally among 12, 15, or 20 students.',
    options: ['40', '60', '80', '120'],
    correctOption: 1,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'What is the sum of the first two prime numbers?',
    options: ['3', '4', '5', '6'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Is 1 a prime or composite number?',
    options: ['Prime', 'Composite', 'Neither prime nor composite', 'Both'],
    correctOption: 2,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Find the HCF of the numbers 8, 9, and 25.',
    options: ['1', '8', '9', '25'],
    correctOption: 0,
  },
  {
    subject: 'Maths',
    chapter: 'Real Numbers',
    title: 'Can two numbers have 18 as their HCF and 380 as their LCM?',
    options: ['Yes', 'No', 'Only if the numbers are even', 'Only if the numbers are odd'],
    correctOption: 1,
  }
];

// ─────────────────────────────────────────────
//  RUNNER – inserts directly into Supabase DB
//  (bypasses HTTP API, no dev server needed)
// ─────────────────────────────────────────────
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

async function run() {
  // Sign in as teacher to get their user ID
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('Login failed:', authError); return; }

  const teacherId = authData.session.user.id;
  console.log(`Logged in as teacher: ${teacherId}`);

  // Use service role client for DB writes
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // Check existing titles to avoid duplicates
  const { data: existing } = await adminClient.from('questions').select('title').eq('created_by', teacherId);
  const existingTitles = new Set((existing || []).map(r => r.title));
  console.log(`Found ${existingTitles.size} existing questions. Seeding ${questions.length} new ones...\n`);

  let ok = 0, skip = 0, fail = 0;

  for (const q of questions) {
    if (existingTitles.has(q.title)) {
      console.log(`⏭️  SKIP (duplicate): ${q.title.slice(0, 60)}`);
      skip++;
      continue;
    }

    const isMaths = q.subject?.toLowerCase().includes('math');
    const { error } = await adminClient.from('questions').insert({
      created_by: teacherId,
      title: q.title,
      body: '',
      subject: q.subject,
      class_grade: '10',
      chapter: q.chapter,
      points: isMaths ? 4 : 3,
      time_limit: 1,
      difficulty: isMaths ? 'hard' : 'moderate',
      options: q.options,
      correct_option: q.correctOption,
      image_path: null,
      image_url: null,
    });

    if (error) {
      console.error(`❌ FAILED [${q.subject}]: ${q.title.slice(0, 60)}\n   Error: ${error.message}`);
      fail++;
    } else {
      console.log(`✅ [${q.subject} | ${q.chapter}] ${q.title.slice(0, 60)}`);
      ok++;
    }

    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\nDone! ✅ ${ok} added  ⏭️  ${skip} skipped (duplicate)  ❌ ${fail} failed`);
}

run();