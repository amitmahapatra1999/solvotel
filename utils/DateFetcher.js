// get todays date
export const GetTodaysDate = () => {
  let today = new Date();
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  if (day.toString().length < 2) {
    day = "0" + day;
  }
  if (month.toString().length < 2) {
    month = "0" + month;
  }

  let dateString = year + "-" + month + "-" + day;
  let dateObject = {
    year,
    month,
    day,
  };
  return { dateString, dateObject };
};

export const GetCustomDate = (date) => {
  // a
  if (date !== null) {
    let today = new Date(date);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    if (day.toString().length < 2) {
      day = "0" + day;
    }
    if (month.toString().length < 2) {
      month = "0" + month;
    }

    let dateString = day + "-" + month + "-" + year;

    return dateString;
  } else {
    return null;
  }
};

export function getNextMonthDate(dateString) {
  const date = new Date(dateString);
  const nextMonth = date.getMonth() + 1;

  // Get the last valid day of the next month
  const lastDayOfNextMonth = new Date(
    date.getFullYear(),
    nextMonth + 1,
    0
  ).getDate();

  // Set the new date, ensuring it does not exceed the last day of the next month
  const newDay = Math.min(date.getDate(), lastDayOfNextMonth);
  const nextMonthDate = new Date(date.getFullYear(), nextMonth, newDay);

  return nextMonthDate.toISOString();
}

// get todays date
export const Get6DateEarly = (date) => {
  const givenDate = new Date(date);

  // Subtract 5 days
  const earlierDateObj = new Date(givenDate);
  earlierDateObj.setDate(givenDate.getDate() - 6);

  // Extract the day, month, and year
  let today = new Date(earlierDateObj);
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  if (day.toString().length < 2) {
    day = "0" + day;
  }
  if (month.toString().length < 2) {
    month = "0" + month;
  }

  let dateString = day + "-" + month + "-" + year;

  return dateString;
};
