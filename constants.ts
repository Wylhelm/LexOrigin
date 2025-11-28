import { LawArticle, DebateQuote } from './types';

export const MOCK_LAWS: LawArticle[] = [
  {
    id: 'CRIM-CODE-229',
    section: '229',
    title: 'Culpable homicide is murder',
    statuteName: 'Criminal Code (R.S.C., 1985, c. C-46)',
    dateEnacted: '1985-12-12',
    content: `Culpable homicide is murder
(a) where the person who causes the death of a human being
  (i) means to cause his death, or
  (ii) means to cause him bodily harm that he knows is likely to cause his death, and is reckless whether death ensues or not;
(b) where a person, meaning to cause death to a human being or meaning to cause him bodily harm that he knows is likely to cause his death, and being reckless whether death ensues or not, by accident or mistake causes death to another human being, notwithstanding that he does not mean to cause death or bodily harm to that human being; or
(c) where a person, for an unlawful object, does anything that he knows or ought to know is likely to cause death, and thereby causes death to a human being, notwithstanding that he desires to effect his object without causing death or bodily harm to any human being.`
  },
  {
    id: 'CRIM-CODE-319',
    section: '319 (1)',
    title: 'Public incitement of hatred',
    statuteName: 'Criminal Code (R.S.C., 1985, c. C-46)',
    dateEnacted: '1985-12-12',
    content: `Every one who, by communicating statements in any public place, incites hatred against any identifiable group where such incitement is likely to lead to a breach of the peace is guilty of
(a) an indictable offence and is liable to imprisonment for a term not exceeding two years; or
(b) an offence punishable on summary conviction.`
  },
  {
    id: 'CRIM-CODE-322',
    section: '322 (1)',
    title: 'Theft',
    statuteName: 'Criminal Code (R.S.C., 1985, c. C-46)',
    dateEnacted: '1985-12-12',
    content: `Every one commits theft who fraudulently and without colour of right takes, or fraudulently and without colour of right converts to his use or to the use of another person, anything, whether animate or inanimate, with intent
(a) to deprive, temporarily or absolutely, the owner of it, or a person who has a special property or interest in it, of the thing or of his property or interest in it;
(b) to pledge it or deposit it as security;
(c) to part with it under a condition with respect to its return that the person who parts with it may be unable to perform; or
(d) to deal with it in such a manner that it cannot be restored in the condition in which it was at the time it was taken or converted.`
  },
  {
    id: 'CRIM-CODE-380',
    section: '380 (1)',
    title: 'Fraud',
    statuteName: 'Criminal Code (R.S.C., 1985, c. C-46)',
    dateEnacted: '1985-12-12',
    content: `Every one who, by deceit, falsehood or other fraudulent means, whether or not it is a false pretence within the meaning of this Act, defrauds the public or any person, whether ascertained or not, of any property, money or valuable security or any service,
(a) is guilty of an indictable offence and liable to a term of imprisonment not exceeding fourteen years, where the subject-matter of the offence is a testamentary instrument or the value of the subject-matter of the offence exceeds five thousand dollars; or
(b) is guilty
  (i) of an indictable offence and is liable to imprisonment for a term not exceeding two years, or
  (ii) of an offence punishable on summary conviction,
where the value of the subject-matter of the offence does not exceed five thousand dollars.`
  }
];

export const MOCK_DEBATES: DebateQuote[] = [
  // Debates for 229 (Murder definitions / revisions historical context)
  {
    id: 'd1',
    lawId: 'CRIM-CODE-229',
    speakerName: 'Hon. John Turner',
    party: 'Liberal',
    date: '1976-02-24',
    topic: 'Bill C-84',
    text: "We must distinguish clearly between intent to kill and recklessness. The moral culpability, Mr. Speaker, lies in the foresight of the consequences. If one knows death is likely, yet proceeds regardless, is that not murder in the eyes of society?",
    sentimentScore: -0.2
  },
  {
    id: 'd2',
    lawId: 'CRIM-CODE-229',
    speakerName: 'Ray Hnatyshyn',
    party: 'Conservative',
    date: '1976-02-25',
    topic: 'Bill C-84',
    text: "While we support the clarification of homicide, we worry that the definition of 'unlawful object' in paragraph (c) casts the net too wide. A mere accident during a minor unlawful act should not automatically be elevated to the highest crime in the land.",
    sentimentScore: -0.6
  },
  {
    id: 'd3',
    lawId: 'CRIM-CODE-229',
    speakerName: 'Stanley Knowles',
    party: 'NDP',
    date: '1976-03-02',
    topic: 'Bill C-84',
    text: "The focus should be on the sanctity of life. Whether by direct intent or callous indifference, the law must protect the vulnerable. However, we must ensure the crown proves knowledge of likelihood beyond a reasonable doubt.",
    sentimentScore: 0.1
  },
  {
    id: 'd4',
    lawId: 'CRIM-CODE-229',
    speakerName: 'Pierre Trudeau',
    party: 'Liberal',
    date: '1976-03-10',
    topic: 'Bill C-84',
    text: "The intention of this House is to codify the common law principles that have stood the test of time, ensuring that those who exhibit a total disregard for human life are held to account.",
    sentimentScore: 0.8
  },
  // Debates for 319 (Hate Speech)
  {
    id: 'd5',
    lawId: 'CRIM-CODE-319',
    speakerName: 'Mark MacGuigan',
    party: 'Liberal',
    date: '1980-11-15',
    topic: 'Charter Alignment',
    text: "Freedom of speech is not absolute. It does not protect the right to shout 'fire' in a crowded theatre, nor should it protect the right to incite violence against a group based on their identity.",
    sentimentScore: 0.5
  },
  {
    id: 'd6',
    lawId: 'CRIM-CODE-319',
    speakerName: 'Perrin Beatty',
    party: 'Conservative',
    date: '1980-11-16',
    topic: 'Charter Alignment',
    text: "We tread a dangerous line. Who defines 'hatred'? Today it is clear, but tomorrow, could political dissent be framed as incitement? We must be vigilant that this tool is not misused.",
    sentimentScore: -0.8
  }
];