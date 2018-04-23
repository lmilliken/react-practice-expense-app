import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = (props) => (
    <header>
      <h1>Expensify</h1>
      <NavLink to="/" activeClassName="is-active" exact={true}>Home</NavLink>
      <NavLink to="/create" activeClassName="is-active">Create Expense</NavLink>
      <NavLink to="/help" activeClassName="is-active">Help Page</NavLink>
    </header>
 );

 export default Header;
