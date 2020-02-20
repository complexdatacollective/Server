import { withProps } from 'recompose';
import resolverClient from '../utils/resolverClient';

const withResolverClient = withProps(() => ({
  resolverClient,
}));

export default withResolverClient;
