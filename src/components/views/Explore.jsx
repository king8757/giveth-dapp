import React from 'react';

import { Consumer as Web3Consumer } from '../../contextProviders/Web3Provider';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { history } from '../../lib/helpers';
import DACs from './DACs';
import Campaigns from './Campaigns';

import JoinGivethCommunity from '../JoinGivethCommunity';

const Explore = () => (
  <div>
    <Web3Consumer>
      {({ state: { balance } }) => (
        <UserConsumer>
          {({ state: { currentUser } }) => (
            <JoinGivethCommunity currentUser={currentUser} balance={balance} history={history} />
          )}
        </UserConsumer>
      )}
    </Web3Consumer>

    <Campaigns />
    <DACs />
  </div>
);

Explore.propTypes = {};

export default Explore;
