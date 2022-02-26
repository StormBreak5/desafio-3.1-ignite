import { GetStaticProps } from 'next';
import Link from 'next/link'
import Head from 'next/head'
import { format } from 'date-fns';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi'

import Prismic from '@prismicio/client'

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { ptBR } from 'date-fns/locale';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<PostPagination>({
    ...postsPagination,
    results: postsPagination.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR
        }
      ),
    })),
  })

  async function loadMore(): Promise<void> {
    const response = await fetch(`${posts.next_page}`).then(data => data.json())

    const postsResponseResults = response.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MM yyyy',
        {
          locale: ptBR
        }
      )
    }))

    const newPosts = {
      ...posts,
      next_page: response.next_page,
      results: [...posts.results, ...postsResponseResults]
    }

    setPosts(newPosts)
  }

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.results.map(post => (
            <article className={styles.postContent} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <time>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>
                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </article>
          ))}
          {posts.next_page && (
            <button type='button' onClick={loadMore}>
              Carregar mais posts
            </button>
          )}

        </div>

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results
  }

  return {
    props: {
      postsPagination
    },

    revalidate: 60 * 60 // 1 hour
  }
};
