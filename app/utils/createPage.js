import { useState } from 'react';
import { useRouter } from 'next/router';
import useViewer from 'Hooks/useViewer';
import { useQuery } from '@apollo/react-hooks';
import Loader from 'Components/Loader';
import Dashboard from 'Layouts/Dashboard';
import ErrorLayout from 'Components/ErrorLayout';

const inject = (obj, props) => (typeof obj === 'function' ? obj(props) : obj);

const createPage = ({
  Component,
  Layout = Dashboard,
  query,
  variables,
  requireFeatures = [],
  requireLogin = true,
  LoaderComponent = () => <Loader />,
  ErrorComponent = ErrorLayout,
  authorize = () => true,
}) => (_props) => {
  const router = useRouter() || { query: _props.params };
  const props = { ..._props, router };
  const [fetched, setFetched] = useState(false);
  const { loading, error, data, ...rest } = useQuery(inject(query, props), {
    variables: inject(variables, props),
    onCompleted: () => !fetched && setFetched(true),
  });

  const viewer = useViewer();

  let content;
  if (loading && !fetched) {
    content = <Loader {...props} />;
  } else if (error) {
    content = <ErrorComponent error={error} {...props} />;
  } else if (requireLogin && !viewer?.user) {
    //TODO(naman): add default access denied layout
    content = '';
  } else if (
    requireFeatures.reduce(
      (res, feature) =>
        res ||
        !viewer.features.find(
          ({ name, enabled }) => name === feature && enabled,
        ),
      false,
    )
  ) {
    content = '';
  } else if (!authorize({ ...data, ...rest, ...props })) {
    content = '';
  } else {
    content = <Component loading={loading} {...data} {...rest} {...props} />;
  }

  return (
    <Layout
      loading={loading}
      error={error}
      data={data}
      router={router}
      {..._props}>
      {content}
    </Layout>
  );
};

export default createPage;
