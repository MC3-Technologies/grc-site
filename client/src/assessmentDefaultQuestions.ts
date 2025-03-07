const surveyJson = {
  pages: [
    {
      title: "First page",
      elements: [
        {
          name: "satisfaction-score",
          title: "How would you describe your experience with our product?",
          type: "radiogroup",
          choices: [
            { value: 5, text: "Fully satisfying" },
            { value: 4, text: "Generally satisfying" },
            { value: 3, text: "Neutral" },
            { value: 2, text: "Rather unsatisfying" },
            { value: 1, text: "Not satisfying at all" },
          ],
          isRequired: true,
        },
        {
          name: "family-history",
          title: "Test",
          type: "matrixdynamic",
          cellType: "text",
          columns: [
            {
              name: "relation",
              title: "Relation",
            },
            {
              name: "health-conditions",
              title: "Health conditions",
            },
            {
              name: "cancer-history",
              title: "Family history of cancer",
            },
          ],
        },
      ],
    },
    {
      elements: [
        {
          name: "what-would-make-you-more-satisfied",
          title: "What can we do to make your experience more satisfying?",
          type: "comment",
        },
        {
          name: "nps-score",
          title:
            "On a scale of zero to ten, how likely are you to recommend our product to a friend or colleague?",
          type: "rating",
          rateMin: 0,
          rateMax: 10,
        },
      ],
    },
    {
      elements: [
        {
          name: "how-can-we-improve",
          title: "In your opinion, how could we improve our product?",
          type: "comment",
        },
      ],
    },
    {
      elements: [
        {
          name: "disappointing-experience",
          title:
            "Please let us know why you had such a disappointing experience with our product",
          type: "comment",
        },
      ],
    },
    {
      title: "Second page",
      elements: [
        {
          name: "favorite-anime",
          title: "What's your favorite animal?",
          type: "comment",
          isRequired: true,
        },
      ],
    },
    {
      elements: [
        {
          name: "what-would-make-you-more-satisfied",
          title: "What can we do to make your experience more satisfying?",
          type: "comment",
        },
        {
          name: "nps-score",
          title:
            "On a scale of zero to ten, how likely are you to recommend our product to a friend or colleague?",
          type: "rating",
          rateMin: 0,
          rateMax: 10,
        },
      ],
    },
    {
      elements: [
        {
          name: "how-can-we-improve",
          title: "In your opinion, how could we improve our product?",
          type: "comment",
        },
      ],
    },
    {
      elements: [
        {
          name: "disappointing-experience",
          title:
            "Please let us know why you had such a disappointing experience with our product",
          type: "comment",
        },
      ],
    },
  ],
};

export { surveyJson };
