- generating migrations
    ```npx drizzle-kit generate```

- migration 
    ```npx drizzle-kit migrate```


- 
    ```
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER -- Essential for accessing auth.users data
    AS $$
    BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
    END;
    $$;
    ```

-
    ```
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
    ```