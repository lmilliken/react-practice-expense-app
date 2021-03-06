// import the default export from firebase/firebase.js which is the variable holding firebase.database() used to 
// access the database.  
import database from '../firebase/firebase';

// These action generators return the thing that is dispatched to the store/reducers (normally it is an object)

// Add expense action generator:
// the expense arg is passed in by the call inside startAddExpense below which has the collected form data and access
// to dispatch since it is an Asynchronous Redux Action
export const addExpense = (expense) => ({
    type: 'ADD_EXPENSE',
    expense
});

/** startAddExpense starts the process of addExpense above - it is called on AddExpensePage:
 * This will update the database, wait for it to correctly sync, and then dispatch the action above to update the store.
 *** This Asynchronous Redux Action generator returns a function instead of an object - made poss. via the middleware 
 *   redux-thunk ***
*/
// pass in the expense data object set to empty object for default in case no expense data is passed (blank form 
// field maybe??)
export const startAddExpense = (expenseData = {}) => {
    // function called internally by redux with dispatch builtin as an arg to grant access to the dispatch() method
    // which can be used after updating/working with the database in .then() callback.
    
    return (dispatch, getState) => {
        // Note: getState is builtin func passed in by redux-thunk - can access current state and grab user uid from auth.uid
        // to use with associating private database data. getState returns the state object, then you can access props on it:
        // getting user id to associate private database data with:
        const uid = getState().auth.uid;
        // this is desctructuring the passed in expenseName obj with values from the form which is passed in on the 
        // parent component containing the form and dispatching this action generator.
        // (defaults are also set in case there is no form data send for the values)
        const {
            description = '', 
            note = '', 
            amount = 0, 
            createdAt = 0 
        } = expenseData;
        // Now variables are created containing corr. form data from the expenseData object passed in

        // assign the passed in expense form data stored in vars above and put them in an object to pass into push()
        // to send them to the database (push will generate a unique id in addition automatically for the expense):
        const expense = { description, note, amount, createdAt };

        // Push data to firebase --
        // .then() callback has access to the reference in it's argument where you can get the id to set it to the store
        // by giving it to the addExpense action generator call:
        // note: ref in the .then arg callback is the snapshot returned by push which is the data that was pushed,
        // so to get the id key assigned by push of the entry, you can access it with .key (ref.key):
        // ****(returning this line enables the chaining of more promises/then()s to it)****** \\
        // Note: ref arg in the then callback is referring to the expense added to the ref or reference?? it's the same as
        // snapshot maybe - access to the item that was added/updated
        return database.ref(`users/${uid}/expenses`).push(expense).then((ref) => {
            // After the push to store the expense in firebase is complete, dispatch the action generator above, 
            // with the object holding the assigned data which was inserted into the database, which updates the store:
            dispatch(addExpense({ 
                id: ref.key, 
                ...expense 
            }));
        });       
    };
};

// updates arg is an object with expense properties/values from the form on EditExpensePage and passed in by startEditExpense.
// The updates object is sent to the reducer which spreads them out to overwrite the expense object props in the state.
export const editExpense = (id, updates) => ({
    type: 'EDIT_EXPENSE',
    id,
    updates
});
// updates arg is an object with expense properties/values from the form on EditExpensePage.
export const startEditExpense = (id, updates) => {
    return (dispatch, getState) => {
        const uid = getState().auth.uid;
        // updates object is {description, amount, createdAt, note} from expense form on EditExpensePage
        return database.ref(`users/${uid}/expenses/${id}`).update(updates) // updates already an object, no need to spread...
           .then(() => {
              dispatch(editExpense(id, updates));
            });       
    };
};

// return an action object with the passed in id (passed in as an object) of the expense to remove
export const removeExpense = ({ id } = {}) => ({ 
    type: 'REMOVE_EXPENSE', 
    id 
});
// Async Redux Function accepts an object passed in containing the expense's id from <EditExpensePage>
export const startRemoveExpense = ({ id } = {}) => {
    return (dispatch, getState) => {
        const uid = getState().auth.uid;
        return database.ref(`users/${uid}/expenses/${id}`).remove().then(() =>{
            dispatch(removeExpense({ id }));
        });       
    };
}; 

/**
 * FETCHING AND SETTING PERSISTENT DATA FROM DB
 * This Async Redux Func is called on the main app.js file to initially set expenses in the store and sync it with
 * the database.
 */

// Sets the array gotten back from Firebase, in startSetExpenses and passed in to it, to the expenses in the store:
export const setExpenses = (expenses) => ({
    type: 'SET_EXPENSES',
    expenses
});
// This Async Redux Function grabs the expenses from the database and passes them to setExpenses which it dispatches
// when done to update the store with them.
export const startSetExpenses = () => {
   // return a function called automatically by redux when this async redux action is called on the home page
   // with access to dispatch:
    return (dispatch, getState) => {
        //user id is set by firebase.auth on app.js
        const uid = getState().auth.uid; 
          // get expenses from the database, convert to an array, then dispatch setExpenses with it to the store:
          // use return to return the promise so you can chain on .then in app.js to render the page when this completes
        return database.ref(`users/${uid}/expenses`).once('value').then((snapshot) => {
            const expenses = [];
            // go through each expense in the expenses object and push it to the expenses array to send with setExpenses dispatch to put them in the store.
            snapshot.forEach((childSnapshot) => {
                expenses.push({
                    id: childSnapshot.key,
                    // remember to use .val() to get the values of the returned entry
                    ...childSnapshot.val()
                });
            });
            // dispatch the setExpenses action with the assembled array of expenses from db passed in:
            // this is what is getting returned from the .then call (return before database,.ref...)
            dispatch(setExpenses(expenses));
        });  
    };
};