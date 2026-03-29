import os
from PIL import Image, ImageDraw, ImageFont
import textwrap

output_dir = r"C:\Users\priyanshu\.gemini\antigravity\brain\7a3d2951-c1fe-407e-a6d1-8a90dbd2d91e"

answers = [
    {
        "q": "Q1. The Fun They Had",
        "question": "Analyze the contrast between the highly mechanized educational system of 2157 and the human-centric schools of the past as depicted in the story. Evaluate the potential emotional and social consequences on a child isolated with a mechanical teacher. (16 Marks)",
        "answer": "Isaac Asimov's 'The Fun They Had' presents a stark contrast between a hyper-mechanized, individualized learning system and the traditional, communal schooling of the past. In 2157, education is a solitary, rigid process. Margie’s 'school' is a mechanical teacher in her house, devoid of any emotional connection, peer interaction, or human empathy. The machine is programmed to her specific level, prioritizing efficiency over emotional growth.\n\nThe story highlights the profound social and emotional consequences of this system. Margie’s growing hatred for her mechanical teacher stems from its unrelenting nature and the pressure of constant testing. Without peers, she lacks the opportunity for collaborative learning, social development, and the simple joy of shared experiences—the 'fun' they had. The human-centric schools of the past, as described in the old book, symbolize community. Children laughed, shouted, and learned together, fostering empathy and social bonds. Asimov implicitly critiques over-reliance on technology, suggesting that true education is not merely the transmission of data, but a holistic social experience that nurtures the human spirit."
    },
    {
        "q": "Q2. The Road Not Taken",
        "question": "'The Road Not Taken' is often misinterpreted as a celebration of non-conformity. Critically examine the tone and the element of self-deception in the speaker's narrative. How does the poem reflect the human tendency to retroactively assign profound meaning to arbitrary choices? (16 Marks)",
        "answer": "While widely read as a poem applauding individualism, 'The Road Not Taken' is fundamentally an exploration of human psychology regarding choice and regret. The speaker stands at a literal and metaphorical fork, struggling to make a decision. However, Frost clearly states that the two paths were 'really about the same' and 'equally lay / In leaves no step had trodden black.' This parity undermines the idea of one path being inherently more adventurous or unique.\n\nThe sigh with which the speaker anticipates telling this story 'ages and ages hence' introduces an element of self-deception. The speaker knows he will inevitably romanticize his decision, claiming he took the path 'less traveled by,' and that it made 'all the difference.' This reflects a universal human tendency: we create narratives to justify our past choices, seeking comfort and meaning in the finality of our decisions. The poem suggests that it is not the nature of the path itself, but our psychological need to believe in our own agency and the uniqueness of our journey, that shapes our retrospective view of life's turning points."
    },
    {
        "q": "Q3. The Sound of Music",
        "question": "Evelyn Glennie’s journey is not just about overcoming a physical disability but also about redefining the perception of music itself. Discuss how she cultivated a unique 'listening' mechanism that transcended auditory senses. (16 Marks)",
        "answer": "Evelyn Glennie’s profound deafness could have easily ended her musical aspirations, but instead, it became the catalyst for a revolutionary approach to music. Her journey is not merely a triumph over adversity; it is a fundamental redefinition of how music is experienced. When traditional auditory pathways failed, Glennie, guided by percussionist Ron Forbes, learned to perceive sound through physical vibration.\n\nShe cultivated a highly sensitized tactile connection to music, feeling the higher notes through the upper part of her body and lower notes from the waist down. By playing barefoot on wooden platforms, she internalized the resonances, turning her entire body into an ear. This process transcended conventional listening, allowing her to 'feel' the texture and emotion of sound in a deeply visceral way. Her story stands as a powerful testament to human resilience and the boundless capacity of the mind to adapt. Glennie proved that music is not confined to the ears; it is an elemental force that can be experienced and expressed through pure, focused intention and physical alignment with rhythm."
    },
    {
        "q": "Q4. Wind",
        "question": "Analyze the dual nature of wind in Subramania Bharati’s poem. How does the poet use this natural force as a metaphor for life's adversities, and what psychological fortitude does he advocate to 'make friends' with it? (16 Marks)",
        "answer": "In Subramania Bharati’s 'Wind,' the titular force is depicted with a duality: it is both a destructive tyrant and a strengthening catalyst. Initially, the wind is a chaotic agent, breaking shutters, scattering papers, and crumbling weak structures—from houses to human hearts. This destructive phase serves as a powerful metaphor for the inevitable storms of life: hardships, failures, and sudden crises that easily crush those who are physically or emotionally fragile.\n\nHowever, the poet does not advocate for despair or futile resistance. Instead, he proposes a proactive, resilient response. He urges the reader to 'build strong homes,' 'firm the body,' and 'make the heart steadfast.' The wind, he observes, blows out weak fires but makes strong fires 'roar and flourish.' Therefore, the psychological fortitude advocated is one of inner strength and preparation. By building resilience, the adversities that once threatened to destroy us become the very friction that strengthens our resolve. We 'make friends' with the wind not by appeasing it, but by rising to match its strength, transforming a destructive force into an empowering one."
    },
    {
        "q": "Q5. The Little Girl",
        "question": "Trace the psychological evolution in Kezia’s perception of her father from a terrifying, authoritarian figure to a vulnerable, exhausted human being. What does this reveal about emotional communication within a family? (16 Marks)",
        "answer": "Katherine Mansfield’s 'The Little Girl' meticulously maps the psychological shift in young Kezia’s view of her father. Initially, her father is perceived through the lens of pure fear. He appears as a looming, authoritarian 'giant'—loud, demanding, and utterly devoid of tenderness. Kezia’s stuttering in his presence and her disastrous attempt to make him a pin-cushion (resulting in physical punishment) reinforce this terrifying image.\n\nThe pivotal transformation occurs when Kezia’s mother is hospitalized, leaving her alone with her father during a terrifying nightmare. To her surprise, her father does not react with anger, but with protective comfort. He carries her to his bed, tucks her in, and falls asleep before she does, exhausted by his daily labor. In that quiet moment of physical closeness, Kezia experiences an epiphany. She realizes that his harshness stems from exhaustion, not cruelty; he is simply too tired to be 'a Mr. Macdonald' (the playful neighbor). This evolution reveals a critical theme: a lack of emotional communication breeds misunderstanding. Kezia’s fear dissolves into profound empathy when she finally sees beneath the facade of the strict provider to the vulnerable, exhausted human being beneath."
    },
    {
        "q": "Q6. A Truly Beautiful Mind",
        "question": "Albert Einstein is universally celebrated for his scientific genius, but the chapter equally emphasizes his humanistic endeavors. Evaluate Einstein’s transformation from a theoretical physicist to a global advocate for peace. (16 Marks)",
        "answer": "The chapter 'A Truly Beautiful Mind' presents Albert Einstein not just as a monumental scientific figure, but as a deeply compassionate global citizen. While his early life was entirely consumed by unravelling the mysteries of the universe—leading to his Special Theory of Relativity—his later years were profoundly shaped by the moral implications of scientific discovery.\n\nEinstein's transformation was precipitated by the horrors of the atomic bombings in Hiroshima and Nagasaki. The very scientific principles he helped uncover had been weaponized with devastating human cost. Deeply shaken, Einstein stepped out of the isolation of theoretical physics and into the political arena. He wrote a public missive to the United Nations, advocating for the formation of a world government to prevent further arms races. For the remainder of his life, he campaigned vigorously against the buildup of arms and used his immense popularity to champion peace and democracy. The title 'A Truly Beautiful Mind' is therefore twofold: it honors his intellectual brilliance, but more importantly, it celebrates his moral beauty—his unwavering commitment to using his voice to protect humanity from destruction."
    },
    {
        "q": "Q7. The Legend of the Northland",
        "question": "Analyze the characterization of Saint Peter and the old lady in the poem. How does the poem employ the metaphor of baking and physical transformation to underscore the consequences of extreme selfishness? (16 Marks)",
        "answer": "Phoebe Cary’s ballad, 'The Legend of the Northland,' operates as a moral fable contrasting divine need with human greed. Saint Peter is characterized as a weary, fasting traveler, representing spiritual vulnerability and the moral test presented to humanity. In stark contrast, the old lady is depicted as the embodiment of extreme selfishness and materialism.\n\nThe poem uses the metaphor of baking to brilliantly illustrate her greed. Despite her seemingly abundant supply of flour, every piece of dough she kneads appears 'too large to give away' when intended for someone else. Her inability to part with even a wafer-thin cake highlights how greed distorts perception. As a consequence, Saint Peter curses her, transforming her into a woodpecker. This physical transformation is highly symbolic: she loses her comfortable human life, her clothes burn to black ashes, and she is condemned to 'boring, and boring, and boring' into hard, dry wood just to find a scanty meal. Her punishment perfectly mirrors her sin; having hoarded easily accessible food, she must now suffer endless, difficult labor for mere survival, underscoring the spiritual and physical cost of a lack of charity."
    },
    {
        "q": "Q8. My Childhood",
        "question": "How does Abdul Kalam’s childhood narrative demonstrate that deeply rooted moral values and communal harmony can supersede religious and social boundaries? Provide examples from the text. (16 Marks)",
        "answer": "In 'My Childhood,' A.P.J. Abdul Kalam constructs a vivid portrait of an inherently secular and harmonious upbringing in Rameswaram. The narrative powerfully argues that moral integrity and human connection transcend religious labels. Kalam, born into a middle-class Muslim family, grew up in a society where Hindu and Muslim communities coexisted organically.\n\nThis harmony is evident in Kalam’s closest childhood friends, all of whom were from orthodox Hindu Brahmin families, yet religious differences never created a barrier. The strength of these bonds is tested and reaffirmed when a new teacher attempts to segregate Kalam from his friend Ramanadha Sastry. The swift intervention of Ramanadha’s father, a high priest, shutting down the teacher’s bigotry, underscores the community's commitment to equality. Furthermore, Kalam’s science teacher, Sivasubramania Iyer, actively rebelled against his own conservative wife to invite Kalam to dine in his ritually pure kitchen. Through these examples, Kalam demonstrates that true spirituality lies in mutual respect and shared humanity. His childhood environment, rich in moral values instilled by his parents and nurtured by the community, laid the foundation for his inclusive worldview."
    },
    {
        "q": "Q9. No Men Are Foreign",
        "question": "James Kirkup’s poem is a poignant anti-war manifesto. Deconstruct the imagery the poet uses to establish the biological and emotional universality of mankind. (16 Marks)",
        "answer": "James Kirkup’s 'No Men Are Foreign' systematically dismantles the artificial boundaries of nationalism through powerful, universal imagery. The poem’s core thesis is that underneath the disparate 'uniforms' of different nations, a single, shared human biology pulses. Kirkup emphasizes that all people walk upon the same earth, breathe the same air, and are warmed by the same sun.\n\nBy highlighting these elemental shared experiences, he strips away the superficial differences of race and nationality. He points out that the 'hands' of our supposed enemies are just like ours—hands that labor, build, and sustain life during 'peaceful harvests.' We all possess eyes that wake and sleep, and hearts that can be won by love, not force. The poet argues that raising arms against our fellow humans is an act of ultimate self-betrayal and self-defilement. It pollutes the very 'hells of fire and dust' that outrage the innocence of our shared atmosphere. Through this vital biological and emotional mapping, Kirkup powerfully asserts that war is fundamentally absurd, as it requires us to destroy a part of our own human family."
    },
    {
        "q": "Q10. The Beggar",
        "question": "In 'The Beggar,' the true catalyst for Lushkoff’s redemption is not Sergei’s employment, but Olga’s empathy. Critically examine how harsh scolding coupled with genuine compassion leads to the character's profound transformation. (16 Marks)",
        "answer": "Anton Chekhov’s 'The Beggar' provides a nuanced psychological study of redemption. When the prominent advocate, Sergei, catches the beggar Lushkoff lying, he believes that strict moralizing and hard labor (chopping wood) will 'save' the man. However, the story reveals that Sergei’s approach, while well-intentioned, is superficial and ineffective. The true catalyst for Lushkoff's salvation is Sergei's cook, Olga.\n\nOlga’s approach is a seemingly paradoxical mix of harsh verbal abuse and profound, silent self-sacrifice. She scolds Lushkoff brutally, calling him a 'miserable creature' and weeping over his wretched state. Yet, recognizing his physical weakness and crippling alcoholism, she chops the wood for him in the freezing cold. This act of unprompted, invisible grace pierces Lushkoff’s hardened exterior. Sergei offered transactional charity (money for labor), but Olga offered transformative compassion (suffering on his behalf). Her tears and her willingness to do his burdensome work reawakened Lushkoff's dormant self-respect. It was her empathy—the fact that someone grieved for his ruined life enough to help him without expecting recognition—that finally gave him the strength to stop drinking and rebuild his life as a respectable notary."
    }
]

def render_image(item, index):
    width = 800
    height = 1000
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Try to load a nice font, otherwise use default
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 32)
        font_q = ImageFont.truetype("arial.ttf", 20)
        font_a_title = ImageFont.truetype("arialbd.ttf", 24)
        font_a = ImageFont.truetype("arial.ttf", 18)
    except IOError:
        font_title = ImageFont.load_default()
        font_q = ImageFont.load_default()
        font_a_title = ImageFont.load_default()
        font_a = ImageFont.load_default()

    y_text = 40
    
    # Draw Title
    title = f"{item['q']}"
    draw.text((40, y_text), title, font=font_title, fill=(0, 0, 0))
    y_text += 60
    
    # Draw Question
    lines = textwrap.wrap(item["question"], width=70)
    for line in lines:
        draw.text((40, y_text), line, font=font_q, fill=(50, 50, 50))
        y_text += 30
    y_text += 30
    
    # Draw Answer Title
    draw.text((40, y_text), "Teacher's Detailed Answer:", font=font_a_title, fill=(0, 100, 0))
    y_text += 40
    
    # Draw Answer
    paragraphs = item["answer"].split('\n\n')
    for p in paragraphs:
        lines = textwrap.wrap(p, width=80)
        for line in lines:
            draw.text((40, y_text), line, font=font_a, fill=(20, 20, 20))
            y_text += 25
        y_text += 15 # paragraph spacing
        
    # Draw border
    draw.rectangle([10, 10, width-10, height-10], outline=(200, 200, 200), width=3)
    
    # Save image
    out_path = os.path.join(output_dir, f"answer_{index}.png")
    img.save(out_path)
    print(f"Saved {out_path}")

for i, ans in enumerate(answers, 1):
    render_image(ans, i)
