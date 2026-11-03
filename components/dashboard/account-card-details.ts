/** What is stored about a cash register besides its balance. Number, expiry and colour are legacy card fields the dialog no longer asks for. */
export type AccountCardDetails = {
  accountName: string;
  cardNumber: string;
  holder: string;
  expiry: string;
  color: string;
};

export const defaultCardColor = "#242426";
